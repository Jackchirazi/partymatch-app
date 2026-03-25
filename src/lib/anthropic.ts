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

  const prompt = `You are a matchmaking genius for a birthday party icebreaker game. Everyone has a "Secret Flame" — one person they are secretly matched with tonight. Your job is to pair everyone into the most entertaining and compatible pairings based on their questionnaire answers.

RULES:
- Every person must be matched with exactly ONE other person.
- Matches are reciprocal: if A matches B, then B matches A.
- IMPORTANT: Match males with females only (opposite-sex matching). If someone's gender is "other" or not specified, they can be matched with anyone.
- If genders are unbalanced (more males than females), the leftover people of the same gender should still be matched with each other rather than going unmatched.
- If there is an odd number of guests after pairing, create one group of 3 (add guest3_id to that entry).
- Look for both similar AND complementary pairings — sometimes opposites make the most fun match!
- The "reason" should be flirty, fun, and specific — referencing their actual answers. Keep it to 1-2 sentences. Make it feel exciting and mysterious.

Here are the guests:

${guestProfiles}

Return ONLY valid JSON in this exact format, with no other text before or after:
{
  "matches": [
    {
      "guest1_id": "id_here",
      "guest2_id": "id_here",
      "reason": "A fun, flirty 1-2 sentence reason referencing their specific answers"
    }
  ]
}

For a trio (odd number), the last entry gets an extra field:
{
  "guest1_id": "id_here",
  "guest2_id": "id_here",
  "guest3_id": "id_here",
  "reason": "Why this trio has undeniable chemistry"
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

export async function improveQuestion(
  currentQuestions: Question[],
  adminMessage: string
): Promise<{ updatedQuestions?: Question[]; suggestion: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const prompt = `You are helping a party host customize their matchmaking questionnaire. The host has a request about their questions.

Current questions (JSON):
${JSON.stringify(currentQuestions, null, 2)}

Host's request: "${adminMessage}"

Based on the request, either:
1. Modify one or more existing questions
2. Add a new question
3. Convert a text question to multiple choice (or vice versa)
4. Suggest a completely new question to add

Return ONLY valid JSON in this format:
{
  "suggestion": "Brief explanation of what you changed/added",
  "updatedQuestions": [/* the full updated questions array */]
}

Rules for questions:
- Each question needs: id (short snake_case string), question (text), type ("choice" or "text")
- choice questions need: options (array of 2-5 strings, can include emojis)
- text questions need: placeholder (example answer)
- Keep the fun, flirty party vibe
- IDs must be unique`;

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

  return JSON.parse(jsonMatch[0]);
}
