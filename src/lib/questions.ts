export type Question = {
  id: string;
  question: string;
  type: "choice" | "text";
  options?: string[];
  placeholder?: string;
};

export const questions: Question[] = [
  // --- Personality ---
  {
    id: "energy",
    question: "At a party, you're most likely to be...",
    type: "choice",
    options: [
      "Starting a dance circle 💃",
      "Deep in a corner conversation 🎙️",
      "Making friends with the host's dog 🐶",
      "Running the aux cord 🎵",
    ],
  },
  {
    id: "weekend",
    question: "Perfect Saturday night?",
    type: "choice",
    options: [
      "Club/bar hopping 🍸",
      "Cozy movie marathon 🎬",
      "Game night with friends 🎲",
      "Spontaneous road trip 🚗",
    ],
  },
  {
    id: "love_language",
    question: "Your love language is...",
    type: "choice",
    options: [
      "Words of affirmation (tell me I'm amazing)",
      "Physical touch (hug it out)",
      "Acts of service (do my dishes)",
      "Gifts (shiny things please)",
      "Quality time (just be here)",
    ],
  },

  // --- Spicy / Dating ---
  {
    id: "dealbreaker",
    question: "Biggest dating dealbreaker?",
    type: "choice",
    options: [
      "Bad texter 📵",
      "Doesn't like animals 🚫🐾",
      "No sense of humor 😐",
      "Chews with mouth open 😬",
      "Replies 'k' 💀",
    ],
  },
  {
    id: "first_date",
    question: "Ideal first date?",
    type: "choice",
    options: [
      "Fancy dinner 🍷",
      "Coffee & a walk ☕",
      "Adventure activity (escape room, bowling) 🎳",
      "Netflix & takeout (no judgment) 🛋️",
      "Concert or show 🎤",
    ],
  },
  {
    id: "flirt_style",
    question: "How do you flirt?",
    type: "choice",
    options: [
      "Relentless eye contact 👀",
      "Memes and humor 😂",
      "Compliments on loop 🥰",
      "I just exist near them and hope 🙃",
      "Bold and direct 🔥",
    ],
  },
  {
    id: "green_flag",
    question: "Biggest green flag in a person?",
    type: "text",
    placeholder: "e.g. 'They remember the little things'",
  },

  // --- Silly ---
  {
    id: "superpower",
    question: "Pick a useless superpower:",
    type: "choice",
    options: [
      "Always finding parking 🚗",
      "Knowing the perfect comeback... 2 hours later 🤦",
      "Any plant you touch thrives 🌱",
      "Phone battery never dies 🔋",
    ],
  },
  {
    id: "survival",
    question: "You'd survive a zombie apocalypse by...",
    type: "choice",
    options: [
      "Leading a ragtag group of survivors 🗡️",
      "Going full hermit in the woods 🏕️",
      "Befriending the zombies somehow 🧟",
      "Definitely not surviving, being honest 💀",
    ],
  },
  {
    id: "hot_take",
    question: "Give us your hottest take:",
    type: "text",
    placeholder: "e.g. 'Cereal is a soup'",
  },
  {
    id: "song",
    question: "Song that plays when you enter a room?",
    type: "text",
    placeholder: "e.g. 'Beyoncé - Crazy in Love'",
  },

  // --- This or That ---
  {
    id: "morning_night",
    question: "Morning person or night owl?",
    type: "choice",
    options: ["Morning person ☀️", "Night owl 🦉"],
  },
  {
    id: "plan_spontaneous",
    question: "Planner or spontaneous?",
    type: "choice",
    options: ["I have a spreadsheet for everything 📊", "What's a plan? 🤷"],
  },
  {
    id: "chaos_order",
    question: "Chaotic energy or calm vibes?",
    type: "choice",
    options: ["Chaos goblin 🔥", "Zen master 🧘"],
  },
  {
    id: "pineapple",
    question: "Pineapple on pizza?",
    type: "choice",
    options: [
      "Absolutely YES 🍍",
      "Absolutely NOT 🚫",
      "I just want peace 🕊️",
    ],
  },
];
