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
  