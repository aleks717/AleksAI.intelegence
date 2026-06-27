export enum AIModel {
  GEMINI = "google-gemini",
  NANO_BANANA = "nano-banana",
  LLAMA_SCOUT = "llama-4-scout",
  OPENAI = "openai-gpt-4o",
  DEEPSEEK = "deepseek-r1",
  CLAUDE = "claude-3-5",
  LLAMA_ULTRA = "llama-3-ultra"
}

export interface User {
  firstName: string;
  lastName: string;
  username: string;
  birthday: string;
  credits: number;
  lastCreditDay: string;
  createdAt: string;
  customApiKey?: string;
  firebaseUid?: string;
  email?: string;
}

export interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: string;
  model?: AIModel;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  audioType?: "sound" | "music";
  soundType?: string;
  musicStyle?: string;
  videoType?: string;
  videoTitle?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  searchSources?: { uri: string; title: string }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: AIModel;
}

export const MODEL_DETAILS = {
  [AIModel.GEMINI]: {
    name: "AlerksAI Intelegence",
    shortName: "AlerksAI Intelegence",
    description: "Googles fortschrittlichstes, kreatives KI-Modell (Gemini Intelligence).",
    color: "from-blue-500 to-indigo-600",
    icon: "✨",
    bgColor: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-850",
  },
  [AIModel.NANO_BANANA]: {
    name: "AlerksAI Nano",
    shortName: "AlerksAI Nano",
    description: "Kostenlose Nano-Banana Version, extrem leichtgewichtige Antworten mit Google-Superpower.",
    color: "from-amber-400 to-yellow-500",
    icon: "⚡",
    bgColor: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-850",
  },
  [AIModel.LLAMA_SCOUT]: {
    name: "AlerksAI neo",
    shortName: "AlerksAI neo",
    description: "Metas hocheffiziente Open-Source-Modellvariante.",
    color: "from-purple-500 to-violet-600",
    icon: "🦙",
    bgColor: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-850",
  },
  [AIModel.OPENAI]: {
    name: "AlerksAI Pro",
    shortName: "AlerksAI Pro",
    description: "Kostenloses Hochleistungsmodell für blitzschnelle Antworten.",
    color: "from-emerald-500 to-teal-600",
    icon: "🟢",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-850",
  },
  [AIModel.LLAMA_ULTRA]: {
    name: "AlerksAI Max",
    shortName: "AlerksAI Max",
    description: "Metas hochentwickeltes 70B-Modell für komplexe Textanalysen und Sprachnuancen.",
    color: "from-indigo-600 to-pink-500",
    icon: "☄️",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-750 dark:text-indigo-300 border-indigo-200 dark:border-indigo-850",
  },
  [AIModel.CLAUDE]: {
    name: "AlerksAI Business",
    shortName: "AlerksAI Business",
    description: "Anthropics Meister der Sprache und logischen Präzision.",
    color: "from-orange-500 to-amber-600",
    icon: "💼",
    bgColor: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-850",
  },
};
