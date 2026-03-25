import { questions } from "./questions";

type GuestData = {
  id: string;
  name: string;
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

function buildQuestionText(questionId: string, answer: string): string {
  const q = questions.find((q) => q.id === questionId);
  if (!q) return `${questionId}: ${answer}`;
  return `${q.question} → ${answer}`;
}

export async function matchGuests(guests: GuestData[]): Promise<MatchResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const guestProfiles = guests
    .map((g) => {
      const answers = JSON.parse(g.answers) as Record<string, string>;
      const formattedAnswers = Object.entries(answers)
        .map(([qId, answer]) => `  - ${buildQuestionText(qId, answer)}`)
        .join("\n");
      return `Name: ${g.name}\nID: ${g.id}\nAnswers:\n${formattedAnswers}`;
    })
    .join("\n\n---\n\n");

  const prompt = `You are a party matchmaking genius helping with a fun birthday party icebreaker game. Your job is to pair everyone into the most entertaining and compatible matches based on their questionnaire answers.

RULES:
- Every person must be matched with exactly ONE other person.
- Matches are reciprocal: if A matches B, then B matches A.
- If there is an odd number of guests, create one group of 3 (add guest3_id to that entry).
- Look for both similar AND complementary pairings — sometimes opposites make the most fun match!
- The "reason" should be fun, specific, and reference their actual answers. Keep it to 1-2 sentences.

Here are the guests:

${guestProfiles}

Return ONLY valid JSON in this exact format, with no other text before or after:
{
  "matches": [
    {
      "guest1_id": "id_here",
      "guest2_id": "id_here",
      "reason": "A fun 1-2 sentence reason why these two are a great match, referencing their specific answers"
    }
  ]
}

For a trio (odd number), the last entry gets an extra field:
{
  "guest1_id": "id_here",
  "guest2_id": "id_here",
  "guest3_id": "id_here",
  "reason": "Why all three make a fun trio"
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

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response (in case there's any extra text)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Claude did not return valid JSON");
  }

  return JSON.parse(jsonMatch[0]) as MatchResult;
}
