export interface Theme {
    id: string;
    user_id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    questions_count?: number; // Optional, for when we join with questions count
    is_language_topic: boolean;
    language_entries_count?: number;
    language_entries?: LanguageEntry[];
    created_at?: string;
}

export interface Question {
    id: string;
    theme_id: string;
    question_text: string;
    question_type: 'input' | 'select' | 'radiobutton';
    is_strict: boolean;
    options: string[] | null; // Array of options for select/radiobutton types
    answer: string | null; // Correct answer for input type questions
    correct_options?: string[] | null; // For select/radiobutton: the correct option(s)
    question_hint?: string | null;
    language_entry_id?: string | null;
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

export interface CreateQuestionDto {
    question_text: string;
    question_type: 'input' | 'select' | 'radiobutton';
    is_strict: boolean;
    options?: string[]; // Required for select/radiobutton, not needed for input
    answer?: string; // Required for input type, not needed for select/radiobutton
    correct_options?: string[]; // Optional correct option(s) for select/radiobutton
}

export interface UpdateQuestionDto {
    question_text?: string;
    question_type?: 'input' | 'select' | 'radiobutton';
    is_strict?: boolean;
    options?: string[];
    answer?: string;
    correct_options?: string[] | null;
}

export interface LanguageEntry {
    id: string;
    theme_id: string;
    word: string;
    description: string | null;
    translation: string;
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

