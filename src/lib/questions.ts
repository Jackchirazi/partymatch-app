export type Question = {
  id: string;
  question: string;
  type: "choice" | "text";
  options?: string[];
  placeholder?: string;
  dimension?: string;
  reveals?: Record<string, string>;
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
    dimension: "Social energy & extroversion",
    reveals: {
      "Work the room — I'm the event": "High extrovert, socially dominant, thrives on novelty and attention",
      "Find one person and go deep": "Selective connector, values depth over breadth, needs an anchor",
      "Orbit the snacks and observe": "Introverted observer, deflects with props/humor, low social performance drive",
      "Make friends with the host's dog": "Self-aware, prefers low-stakes non-performative connection",
    },
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
    dimension: "Spontaneity vs. structure & emotional resilience",
    reveals: {
      "Honestly relieved": "High introvert baseline, socializing costs energy, values downtime",
      "Immediately texting someone else": "High social drive, extrovert, rarely needs alone time",
      "Spiral for 10 minutes then chill": "Moderate anxiety, emotionally honest, adaptable once grounded",
      "Already had a backup plan tbh": "Planner type, low tolerance for ambiguity, self-reliant",
    },
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
    dimension: "Humor style & comedic register",
    reveals: {
      "Deadpan and dry": "Wit-forward, controlled delivery, prizes subtlety, can read as aloof",
      "Chaotic and unhinged": "High-energy absurdist, low filter, fun but intense in large doses",
      "Clever callbacks and references": "Pop-culture literate, pattern-recognition humor, rewards attentive audience",
      "Physical comedy and big reactions": "Performative, expressive, high body language, extroverted communicator",
    },
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
    dimension: "Communication style & verbal intimacy",
    reveals: {
      "Paragraphs — I communicate": "Verbal processor, invests in relationships through language, can feel intense",
      "Short and fast, like a machine gun": "High responsiveness, low formality, prefers real-time rhythm",
      "Voice notes or it didn't happen": "Warm, informal, comfort with vulnerability, slightly chaotic",
      "Takes 3 hours but the reply is good": "Thoughtful, independent, high quality over quantity",
    },
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
    dimension: "Boundary style & communication format comfort",
    reveals: {
      "Answer immediately": "Open access, low phone anxiety, extrovert-leaning",
      "Decline and text 'what's up'": "Prefers format control, mild phone aversion, practical",
      "Let it ring and feel guilty": "Conflict-avoidant, anxious about unexpected demands",
      "Depends entirely on who it is": "Strong inner/outer circle distinction, context-driven",
    },
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
    dimension: "Spontaneity tolerance & decision velocity",
    reveals: {
      "Already putting on shoes": "Impulsive, FOMO-driven, high spontaneity",
      "Need at least 2 hours notice": "Routine-dependent, needs mental prep, planner type",
      "Depends entirely on the vibe": "Gut-driven, moderate flexibility, reads situation over rule",
      "Ask 10 questions before deciding": "Risk-averse, information-gatherer, needs control before committing",
    },
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
    dimension: "Preferred social scale & crowd energy",
    reveals: {
      "Just us two": "Intimacy-forward, dislikes diluted attention, values one-on-one depth",
      "4-6, tight crew": "Social but curated, group loyalty over quantity",
      "Big group, more chaos more fun": "Extrovert, high stimulation threshold, fluid social situations",
      "Whoever shows up": "Low-maintenance, easy social energy, non-possessive",
    },
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
    dimension: "Conflict style & emotional directness",
    reveals: {
      "Say something, nicely": "Direct but calibrated, emotionally mature, low tolerance for tension",
      "Suffer silently and vent later": "Conflict-avoidant, internalizer, needs trusted outlet",
      "Make it a bit and move on": "Deflects with humor, uncomfortable with confrontation",
      "Remove myself from the situation": "Strong self-preservation, prefers exit over engagement",
    },
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
    dimension: "Social initiation style",
    reveals: {
      "Lock eyes with someone and start talking": "High social confidence, extroverted initiator",
      "Find the quietest person there": "Empathetic, contrarian socially, seeks connection outside the mainstream",
      "Stand near drinks until someone talks to me": "Passive initiator, socially dependent, needs approach to come to them",
      "Look busy until I find my people": "Identity-protective, reads the room before committing",
    },
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
    dimension: "Decision leadership & group role",
    reveals: {
      "Just pick something and commit": "Leader type, decisive, takes ownership, low dithering tolerance",
      "Go along with whatever": "Deferential, suppresses preferences to keep peace",
      "Suggest something but don't push it": "Collaborative, offers input without dominance",
      "Quietly disappear until it's decided": "Disengages under friction, independent streak",
    },
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
    dimension: "Rest style & baseline energy level",
    reveals: {
      "Explore somewhere new": "High base energy, curiosity-driven, dislikes inertia",
      "Fully horizontal, no negotiations": "Protective of downtime, firm about rest, introvert recharge",
      "Brunch then see what happens": "Social but unstructured, gentle momentum, anti-planner",
      "Productive — errands, gym, life admin": "High self-discipline, driven, satisfaction from completion",
    },
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
    dimension: "Self-assessed energy level & compatibility preference",
    reveals: {
      "Equally chaotic as you": "Self-identifies as high-energy, wants a partner in crime",
      "Calmer than you": "Self-aware about intensity, seeks regulation through contrast",
      "Matched energy exactly": "Harmony-seeker, values synchrony",
      "Completely unpredictable": "Novelty-seeker, gets bored easily, drawn to chaos",
    },
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
    dimension: "Conversational depth preference & intellectual intimacy",
    reveals: {
      "Deep talk, always": "Emotionally and intellectually hungry, dislikes surface-level",
      "Laughing until someone cries": "Levity-first, connection through joy, may deflect from heavy topics",
      "Starts as one, ends as the other": "Flexible, values full emotional range, socially fluid",
      "Depends entirely on the person": "Adaptive, highly attuned to the other person, chemistry-dependent",
    },
  },
  {
    id: "hot_take",
    question: "Give us a take you'd actually defend:",
    type: "text",
    placeholder: "e.g. 'Airports are underrated'",
    dimension: "Worldview, intellectual style & self-image",
  },
  {
    id: "song",
    question: "Song that's playing when you're actually having the best time:",
    type: "text",
    placeholder: "e.g. 'Kendrick - Not Like Us'",
    dimension: "Social identity, energy signature & taste",
  },
];
