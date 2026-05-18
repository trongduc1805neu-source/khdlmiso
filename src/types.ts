export interface SourceReference {
  cell_type: string;
  cell_index: number;
  topic: string;
}

export interface Question {
  id: number;
  chapterId?: number;
  difficulty?: string;
  bloom_level?: string;
  question_type?: string;
  knowledge_area?: string;
  content: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation?: string;
  source_reference?: SourceReference;
}

export interface Chapter {
  chapter: number;
  chapter_title?: string;
  timeLimit?: number; // Time limit in seconds
  knowledge_map?: {
    topics: string[];
  };
  questions: Question[];
}
