export type Question = {
  id: string;
  question: string;
  type: "choice" | "text";
  options?: string[];
  placeholder?: string;
};

export const questions: Question[] = [
  {
    id: "party_role",
    question: "At a party where you barely know anyone, you...",
    type: "choice",
    options: [
      "Work the room — I'm the event",
      "Find one person and go deep",
      "Orbit the snacks and observe",
      "Make friends with the host's dog",
    ],
  },
  {
    id: "plans_cancelled",
    question: "Plans just got cancelled last minute. You feel...",
    type: "choice",
    options: [
      "Honestly relieved",
      "Immediately texting someone else",
      "Spiral for 10 minutes then chill",
      "Already had a backup plan tbh",
    ],
  },
  {
    id: "humor_style",
    question: "Your humor is mostly...",
    type: "choice",
    options: [
      "Deadpan and dry",
      "Chaotic and unhinged",
      "Clever callbacks and references",
      "Physical comedy and big reactions",
    ],
  },
  {
    id: "texting",
    question: "Your texting style is...",
    type: "choice",
    options: [
      "Paragraphs — I communicate",
      "Short and fast, like a machine gun",
      "Voice notes or it didn't happen",
      "Takes 3 hours but the reply is good",
    ],
  },
  {
    id: "someone_calls",
    question: "Someone calls instead of texting. You...",
    type: "choice",
    options: [
      "Answer immediately",
      "Decline and text 'what's up'",
      "Let it ring and feel guilty",
      "Depends entirely on who it is",
    ],
  },
  {
    id: "last_minute",
    question: "\"Come out, we're leaving in 30 minutes.\" You...",
    type: "choice",
    options: [
      "Already putting on shoes",
      "Need at least 2 hours notice",
      "Depends entirely on the vibe",
      "Ask 10 questions before deciding",
    ],
  },
  {
    id: "group_dynamic",
    question: "Ideal group size for a night out?",
    type: "choice",
    options: [
      "Just us two",
      "4-6, tight crew",
      "Big group, more chaos more fun",
      "Whoever shows up",
    ],
  },
  {
    id: "conflict",
    question: "Someone in the group is being annoying. You...",
    type: "choice",
    options: [
      "Say something, nicely",
      "Suffer silently and vent later",
      "Make it a bit and move on",
      "Remove myself from the situation",
    ],
  },
  {
    id: "stranger_room",
    question: "You walk into a room full of strangers. First move?",
    type: "choice",
    options: [
      "Lock eyes with someone and start talking",
      "Find the quietest person there",
      "Stand near drinks until someone talks to me",
      "Look busy until I find my people",
    ],
  },
  {
    id: "group_deadlock",
    question: "The group can't agree on what to do. You...",
    type: "choice",
    options: [
      "Just pick something and commit",
      "Go along with whatever",
      "Suggest something but don't push it",
      "Quietly disappear until it's decided",
    ],
  },
  {
    id: "sunday",
    question: "Ideal Sunday:",
    type: "choice",
    options: [
      "Explore somewhere new",
      "Fully horizontal, no negotiations",
      "Brunch then see what happens",
      "Productive — errands, gym, life admin",
    ],
  },
  {
    id: "energy_match",
    question: "You'd vibe best with someone who is...",
    type: "choice",
    options: [
      "Equally chaotic as you",
      "Calmer than you",
      "Matched energy exactly",
      "Completely unpredictable",
    ],
  },
  {
    id: "conversation",
    question: "Deep conversations or chaos and laughing?",
    type: "choice",
    options: [
      "Deep talk, always",
      "Laughing until someone cries",
      "Starts as one, ends as the other",
      "Depends entirely on the person",
    ],
  },
  {
    id: "hot_take",
    question: "Give us a take you'd actually defend:",
    type: "text",
    placeholder: "e.g. 'Airports are underrated'",
  },
  {
    id: "song",
    question: "Song that's playing when you're actually having the best time:",
    type: "text",
    placeholder: "e.g. 'Kendrick - Not Like Us'",
  },
];
