export interface Theme {
    id: string;
    user_id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    questions_count?: number; // Optional, for when we join with questions count
}

export interface Question {
    id: string;
    theme_id: string;
    question_text: string;
    question_type: 'input' | 'select' | 'radiobutton';
    is_strict: boolean;
    options: string[] | null; // Array of options for select/radiobutton types
}

export interface CreateThemeDto {
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface UpdateThemeDto {
    title?: string;
    description?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface CreateQuestionDto {
    question_text: string;
    question_type: 'input' | 'select' | 'radiobutton';
    is_strict: boolean;
    options?: string[]; // Required for select/radiobutton, not needed for input
}

export interface UpdateQuestionDto {
    question_text?: string;
    question_type?: 'input' | 'select' | 'radiobutton';
    is_strict?: boolean;
    options?: string[];
}

