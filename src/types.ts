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
  fileName?: string;
  fileSize?: string;
  fileType?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: AIModel;
}

export const MODEL_DETAILS = {
  [AIModel.GEMINI]: {
    name: "AleksAI Max",
    shortName: "AleksAI Max",
    description: "Googles fortschrittlichstes, kreatives KI-Modell.",
    color: "from-blue-550 to-indigo-650",
    icon: "✨",
    bgColor: "bg-blue-50 text-blue-700 border-blue-105",
  },
  [AIModel.NANO_BANANA]: {
    name: "AleksAI Nano (Gemini Flash-Lite)",
    shortName: "AleksAI Nano",
    description: "Kostenlose Nano-Banana Version, extrem leichtgewichtige Antworten mit Google-Superpower.",
    color: "from-amber-400 to-yellow-500",
    icon: "🍌",
    bgColor: "bg-amber-50 text-amber-700 border-amber-105",
  },
  [AIModel.LLAMA_SCOUT]: {
    name: "AleksAI neo",
    shortName: "AleksAI neo",
    description: "Metas hocheffiziente Open-Source-Modellvariante.",
    color: "from-purple-500 to-violet-600",
    icon: "🦙",
    bgColor: "bg-purple-50 text-purple-700 border-purple-101",
  },
  [AIModel.OPENAI]: {
    name: "AleksAI Pro",
    shortName: "AleksAI Pro",
    description: "Kostenloses Hochleistungsmodell für blitzschnelle Antworten.",
    color: "from-emerald-500 to-teal-600",
    icon: "🟢",
    bgColor: "bg-emerald-50 text-emerald-700 border-emerald-101",
  },
  [AIModel.LLAMA_ULTRA]: {
    name: "AleksAI Ultra",
    shortName: "AleksAI Ultra",
    description: "Metas hochentwickeltes 70B-Modell für komplexe Textanalysen und Sprachnuancen.",
    color: "from-indigo-600 to-pink-550",
    icon: "☄️",
    bgColor: "bg-indigo-50 text-indigo-750 border-indigo-151",
  },
  [AIModel.CLAUDE]: {
    name: "AleksAI buissnis",
    shortName: "AleksAI buissnis",
    description: "Anthropics Meister der Sprache und logischen Präzision.",
    color: "from-orange-500 to-amber-600",
    icon: "☁️",
    bgColor: "bg-orange-50 text-orange-700 border-orange-101",
  },
};
