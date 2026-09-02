import type { CategoryId, Lesson, LanguageCode, Level, Question } from "./types";

/** Translation payload for one lesson. Keys mirror the English lesson shape. */
export type LessonTx = {
  title: string;
  summary: string;
  explanation: string[];
  example: { title: string; body: string };
  interactive: { prompt: string; options: string[]; explanation: string };
  /** Keyed by the English question id (q1, q2, …). */
  quiz: Record<
    string,
    {
      prompt: string;
      /** Required for `kind: "choice"` questions — same order as English. */
      options?: string[];
      /** Required for `kind: "input"` questions — translated expected answer. */
      answer?: string;
      accepts?: string[];
      explanation: string;
    }
  >;
  challenge: { title: string; prompt: string };
  recap: string[];
};

export type LessonTxMap = Record<string, LessonTx>;

export type ContentPack = {
  lessons: LessonTxMap;
  levels: Record<number, { title: string; subtitle: string }>;
  categories: Partial<Record<CategoryId, string>>;
  achievements: Record<string, { title: string; description: string }>;
};

const PACKS: Partial<Record<LanguageCode, ContentPack>> = {};

export function registerContentPack(lang: LanguageCode, pack: ContentPack) {
  PACKS[lang] = pack;
}

export function getContentPack(lang: LanguageCode): ContentPack | undefined {
  return PACKS[lang];
}

function localizeQuestion(q: Question, tx: LessonTx["quiz"][string] | undefined): Question {
  if (!tx) return q;
  if (q.kind === "choice") {
    return {
      ...q,
      prompt: tx.prompt,
      options: tx.options ?? q.options,
      explanation: tx.explanation,
    };
  }
  const accepts = tx.accepts ?? q.accepts;
  return {
    ...q,
    prompt: tx.prompt,
    answer: tx.answer ?? q.answer,
    ...(accepts ? { accepts } : {}),
    explanation: tx.explanation,
  };
}

/** Returns the lesson with translated copy when a pack exists; English otherwise. */
export function localizeLesson(lesson: Lesson, lang: LanguageCode): Lesson {
  const tx = getContentPack(lang)?.lessons[lesson.id];
  if (!tx) return lesson;
  return {
    ...lesson,
    title: tx.title,
    summary: tx.summary,
    explanation: tx.explanation,
    example: tx.example,
    interactive: localizeQuestion(lesson.interactive, tx.interactive
      ? { ...tx.interactive }
      : undefined) as Lesson["interactive"],
    quiz: lesson.quiz.map((q) => localizeQuestion(q, tx.quiz[q.id])),
    challenge: tx.challenge,
    recap: tx.recap,
  };
}

export function localizeLevel(level: Level, lang: LanguageCode): Level {
  const tx = getContentPack(lang)?.levels[level.id];
  return {
    ...level,
    title: tx?.title ?? level.title,
    subtitle: tx?.subtitle ?? level.subtitle,
    lessons: level.lessons.map((l) => localizeLesson(l, lang)),
  };
}

export function localizeCategoryLabel(id: CategoryId, fallback: string, lang: LanguageCode): string {
  return getContentPack(lang)?.categories[id] ?? fallback;
}

export function localizeAchievement(
  id: string,
  fallback: { title: string; description: string },
  lang: LanguageCode,
): { title: string; description: string } {
  return getContentPack(lang)?.achievements[id] ?? fallback;
}
