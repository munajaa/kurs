
export interface Lesson {
  id: string;
  order: number;
  title: string;
  description: string;
  content: string; // The full text of the lesson
  thumbnailUrl?: string;
  duration: string;
  category: string;
}

export interface UserProgress {
  completedLessonIds: string[];
}
