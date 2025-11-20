import { makeAutoObservable } from 'mobx';

export type Theme = {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: number;
};

let themeId = 0;
const generateId = () => {
  themeId += 1;
  return `theme-${themeId}`;
};

class ThemeStore {
  themes: Theme[] = [
    {
      id: generateId(),
      title: 'Neuroscience Basics',
      description: 'Explore the fundamental structures and functions of the brain.',
      difficulty: 'Easy',
      questions: 12,
    },
    {
      id: generateId(),
      title: 'Cognitive Psychology',
      description: 'Dive into perception, memory, and decision making challenges.',
      difficulty: 'Medium',
      questions: 15,
    },
    {
      id: generateId(),
      title: 'AI Ethics',
      description: 'Debate dilemmas around AI governance, bias, and transparency.',
      difficulty: 'Hard',
      questions: 10,
    },
  ];

  selectedThemeIds: string[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  toggleTheme(themeId: string) {
    if (this.selectedThemeIds.includes(themeId)) {
      this.selectedThemeIds = this.selectedThemeIds.filter((id) => id !== themeId);
    } else {
      this.selectedThemeIds = [...this.selectedThemeIds, themeId];
    }
  }

  addTheme(theme: Omit<Theme, 'id'>) {
    const newTheme: Theme = {
      ...theme,
      id: generateId(),
    };
    this.themes = [...this.themes, newTheme];
  }

  isSelected(themeId: string) {
    return this.selectedThemeIds.includes(themeId);
  }

  get selectedThemes() {
    return this.themes.filter((theme) => this.selectedThemeIds.includes(theme.id));
  }

  get canPlay() {
    return this.selectedThemeIds.length > 0;
  }

  resetSelection() {
    this.selectedThemeIds = [];
  }
}

export const themeStore = new ThemeStore();

