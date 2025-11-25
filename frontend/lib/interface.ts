export interface User {
    name: string
}

export interface Theme {
    id: string;
    user_id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    questions: number;
    is_language_topic?: boolean;
    language_entries_count?: number;
    language_entries?: LanguageEntry[];
}

export interface LanguageEntry {
    id: string;
    theme_id: string;
    word: string;
    description: string | null;
    translation: string;
}

export interface CreateThemeDto {
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    is_language_topic?: boolean;
}

export interface UpdateThemeDto {
    title?: string;
    description?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    is_language_topic?: boolean;
}

export interface Question {
    id: string;
    theme_id: string;
    question_text: string;
    question_type: 'input' | 'select' | 'radiobutton';
    is_strict: boolean;
    options: string[] | null;
    answer: string | null;
    correct_options?: string[] | null;
}

export interface CreateQuestionDto {
    question_text: string;
    question_type: 'input' | 'select' | 'radiobutton';
    is_strict: boolean;
    options?: string[];
    answer?: string;
    correct_options?: string[];
}

export interface UpdateQuestionDto {
    question_text?: string;
    question_type?: 'input' | 'select' | 'radiobutton';
    is_strict?: boolean;
    options?: string[];
    answer?: string;
    correct_options?: string[] | null;
}

export interface CreateLanguageEntryDto {
    word: string;
    description?: string;
    translation: string;
}

export interface UpdateLanguageEntryDto {
    word?: string;
    description?: string | null;
    translation?: string;
}

export interface GlobalStats {
    totalUsers: number;
    totalThemes: number;
    totalQuestions: number;
    totalGamesPlayed: number;
    totalQuestionsAnswered: number;
    knowledgeDistribution: {
        dontKnow: number;
        know: number;
        wellKnow: number;
        perfectlyKnow: number;
    };
}
  