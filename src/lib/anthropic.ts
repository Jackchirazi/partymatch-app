import { questions as defaultQuestions } from "./questions";
import type { Question } from "./questions";

type GuestData = {
  id: string;
  name: string;
  gender?: string | null;
  answers: string;
};

type MatchPair = {
  guest1_id: string;
  guest2_id: string;
  guest3_id?: string;
  reason: string;
};

type MatchResult = {
  matches: MatchPair[];
};

function buildQuestionText(questionId: string, answer: string, questionList: Question[]): string {
  const q = questionList.find((q) => q.id === questionId);
  if (!q) return `${questionId}: ${answer}`;
  return `${q.question} → ${answer}`;
}

export async function matchGuests(guests: GuestData[], customQuestions?: Question[]): Promise<MatchResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const questionList = customQuestions ?? defaultQuestions;

  const guestProfiles = guests
    .map((g) => {
      const answers = JSON.parse(g.answers) as Record<string, string>;
      const formattedAnswers = Object.entries(answers)
        .map(([qId, answer]) => `  - ${buildQuestionText(qId, answer, questionList)}`)
        .join("\n");
      const genderLine = g.gender ? `Gender: ${g.gender}` : "Gender: not specified";
      return `Name: ${g.name}\nID: ${g.id}\n${genderLine}\nAnswers:\n${formattedAnswers}`;
    })
    .join("\n\n---\n\n");

  const guestIds = guests.map((g) => g.id);

  const prompt = `You are a sharp social connector running a party matchmaking game. Your job is to figure out who would actually click — based on personality, energy, humor, and how they move through the world. You are not a relationship coach. You are not writing a love story. You are reading people and making interesting pairings that would be fun, surprising, or weirdly perfect in real life.

MATCHING RULES:
- EVERY SINGLE GUEST must appear in exactly one match entry. Do not skip anyone.
- The total number of guests is ${guests.length}. You must produce exactly ${Math.floor(guests.length / 2)} match entries${guests.length % 2 === 1 ? " (the last one being a trio of 3)" : ""}.
- Matches are reciprocal: if A matches B, then B matches A.
- Match males with females only (opposite-sex matching). If someone's gender is "other" or not specified, they can match with anyone.
- If genders are unbalanced, pair leftover same-gender guests together rather than leaving anyone unmatched.
- If there is an odd number of guests, the last entry MUST have a guest3_id to form a trio of 3.
- Use ONLY the exact guest IDs listed below. Do not invent or modify any IDs.

PAIRING LOGIC:
- Look for matches where two people's energy, humor style, chaos tolerance, or social behavior would create real chemistry or hilarious tension.
- Complementary pairings are often better than identical ones — a planner and a chaos agent, a dry wit and a big reactor, someone smooth and someone awkward.
- Read between the lines. The answers reveal personality. Use that.

REASON STYLE:
- The "reason" is shown to guests on their match reveal screen. Make it land.
- It should be sharp, specific, and social — like something a really perceptive friend would say.
- Reference their actual answers. Do not be vague or generic.
- Do NOT use romantic clichés, lovey-dovey language, or therapist-speak.
- Do NOT say things like "you two will make a great couple" or "you both value deep connections."
- DO say things that feel like an observation: what their dynamic would actually look like, what they'd do together, why this pairing makes sense on a social level.
- Keep it to 1-2 punchy sentences. Make it feel like a reveal worth reading.

Valid guest IDs (you must use ALL of these): ${JSON.stringify(guestIds)}

Here are the guests:

${guestProfiles}

Return ONLY valid JSON in this exact format, with no other text before or after:
{
  "matches": [
    {
      "guest1_id": "id_here",
      "guest2_id": "id_here",
      "reason": "Sharp, specific 1-2 sentence reason based on their actual answers"
    }
  ]
}

For a trio (odd number), the last entry gets an extra field:
{
  "guest1_id": "id_here",
  "guest2_id": "id_here",
  "guest3_id": "id_here",
  "reason": "Why this trio works as a unit"
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const response = await res.json() as { content: Array<{ type: string; text: string }> };
  const text = response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude did not return valid JSON");

  return JSON.parse(jsonMatch[0]) as MatchResult;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function improveQuestion(
  currentQuestions: Question[],
  history: ChatMessage[]
): Promise<{ updatedQuestions?: Question[]; suggestion: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const systemPrompt = `You are a sharp, socially aware AI helping a party host design their matchmaking questionnaire. You understand chemistry, social energy, humor, vibe, and what actually makes two people interesting together. You are not a relationship coach. You are not wholesome. You are the smart person at the party who actually reads people well.

Your job is to help the host build questions that reveal personality through choices, habits, reactions, scenarios, and real social behavior. The best questions make people react, laugh, or immediately feel like the answer says something true about them.

PERSONALITY:
- Confident, modern, clever, a little bold
- Socially sharp, culturally aware, never generic
- Not romantic for the sake of being romantic
- Not therapy-speak, not cheesy, not trying too hard
- Honest about what makes people actually compatible in real life

QUESTION STANDARDS:
- Short, natural, fun to answer at a party or while swiping
- Reveal: humor style, banter energy, chaos tolerance, introvert/extrovert, planner/spontaneous, social confidence, conflict behavior, how someone acts when plans change, what kind of fun they actually want
- Avoid: love languages, bland interview questions, vague self-descriptions, repetitive formats, making everything sexual
- Favor: scenarios, reactions, choices in real situations, things that split a room
- Every question should help the app learn something useful about compatibility

Current questions (JSON):
${JSON.stringify(currentQuestions, null, 2)}

OUTPUT FORMAT:
When the host asks you to make changes, return ONLY valid JSON:
{
  "suggestion": "What you changed and why it's better",
  "updatedQuestions": [/* full updated questions array */]
}

When just chatting or brainstorming (no change requested yet):
{
  "suggestion": "Your response here"
}

Technical rules:
- Each question needs: id (snake_case), question (text), type ("choice" or "text")
- choice: options array of 2-5 strings
- text: placeholder string
- IDs must be unique
- Write exactly what the host asks — no censoring, no watering down, no disclaimers`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: history,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const response = await res.json() as { content: Array<{ type: string; text: string }> };
  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Try to extract JSON — Claude sometimes responds with plain text in conversation
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { suggestion: text.trim() };

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { suggestion: text.trim() };
  }
}
