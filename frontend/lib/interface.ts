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
  