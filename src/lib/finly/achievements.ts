import { ALL_LESSONS } from "./curriculum";
import type { ProgressState } from "./progress";

export type Achievement = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  check: (s: ProgressState) => boolean;
};

const completedCount = (s: ProgressState) => Object.keys(s.lessons).length;
const perfectCount = (s: ProgressState) =>
  Object.values(s.lessons).filter((l) => l.total > 0 && l.correct === l.total).length;
const levelDone = (s: ProgressState, levelId: number) =>
  ALL_LESSONS.filter((l) => l.levelId === levelId).every((l) => s.lessons[l.id]);
const categoryDone = (s: ProgressState, category: string) =>
  ALL_LESSONS.filter((l) => l.category === category).every((l) => s.lessons[l.id]);

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-lesson", title: "First Lesson", emoji: "🏆", description: "Complete your very first lesson.", check: (s) => completedCount(s) >= 1 },
  { id: "first-quiz", title: "Perfect Quiz", emoji: "🎯", description: "Answer every quiz question in a lesson correctly.", check: (s) => perfectCount(s) >= 1 },
  { id: "streak-7", title: "7-Day Streak", emoji: "🔥", description: "Learn on 7 days in a row.", check: (s) => s.streak.best >= 7 },
  { id: "streak-30", title: "30-Day Streak", emoji: "🌋", description: "Learn on 30 days in a row.", check: (s) => s.streak.best >= 30 },
  { id: "budget-master", title: "Budget Master", emoji: "📊", description: "Finish every Budgeting lesson.", check: (s) => categoryDone(s, "budgeting") },
  { id: "saving-basics", title: "Saving Basics", emoji: "🐖", description: "Finish every Saving lesson.", check: (s) => categoryDone(s, "saving") },
  { id: "debt-detective", title: "Debt Detective", emoji: "🕵️", description: "Finish every Credit & Debt lesson.", check: (s) => categoryDone(s, "credit-debt") },
  { id: "investing-beginner", title: "Investing Beginner", emoji: "📈", description: "Complete Investing Basics.", check: (s) => !!s.lessons["investing-basics"] },
  { id: "level-1", title: "Money Basics Cleared", emoji: "🌱", description: "Complete all of Level 1.", check: (s) => levelDone(s, 1) },
  { id: "level-3", title: "Smart Money Cleared", emoji: "🧠", description: "Complete all of Level 3.", check: (s) => levelDone(s, 3) },
  { id: "challenger", title: "Challenger", emoji: "💪", description: "Complete 5 real-life challenges.", check: (s) => s.challenges.length >= 5 },
  { id: "halfway", title: "Halfway There", emoji: "🧗", description: "Complete half of all lessons.", check: (s) => completedCount(s) >= Math.ceil(ALL_LESSONS.length / 2) },
  { id: "all-lessons", title: "Full Course", emoji: "🎓", description: "Complete every lesson in Cashloria.", check: (s) => completedCount(s) >= ALL_LESSONS.length },
  { id: "xp-1000", title: "1,000 XP", emoji: "⭐", description: "Earn 1,000 XP.", check: (s) => s.xp >= 1000 },
];
