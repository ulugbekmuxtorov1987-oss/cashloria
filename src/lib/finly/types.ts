export type CategoryId =
  | "money-basics"
  | "budgeting"
  | "banking"
  | "credit-debt"
  | "saving"
  | "investing"
  | "risk-insurance"
  | "taxes"
  | "psychology"
  | "planning"
  | "safety";

export type Source = { label: string; url: string };

export type Question =
  | {
      id: string;
      kind: "choice";
      type: "multiple-choice" | "true-false" | "scenario" | "match" | "calculate";
      prompt: string;
      options: string[];
      answer: number;
      explanation: string;
    }
  | {
      id: string;
      kind: "input";
      type: "fill-blank" | "calculate";
      prompt: string;
      answer: string;
      accepts?: string[];
      explanation: string;
    };

export type Lesson = {
  id: string;
  levelId: number;
  title: string;
  emoji: string;
  category: CategoryId;
  difficulty: "beginner" | "intermediate" | "advanced";
  minutes: number;
  xp: number;
  summary: string;
  explanation: string[];
  example: { title: string; body: string };
  interactive: Extract<Question, { kind: "choice" }>;
  quiz: Question[];
  challenge: { title: string; prompt: string };
  recap: string[];
  sources: Source[];
};

export type Level = {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  lessons: Lesson[];
};

export type CountryCode = "US" | "GB" | "UZ";
export type LanguageCode = "en" | "ru";
