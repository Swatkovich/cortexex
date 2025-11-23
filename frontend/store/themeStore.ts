import { makeAutoObservable, runInAction, autorun } from 'mobx';
import * as api from '@/lib/api';
import { CreateThemeDto, UpdateThemeDto } from '@/lib/interface';

export type Theme = {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: number;
};

class ThemeStore {
  themes: Theme[] = [];
  selectedThemeIds: string[] = [];
  loading = false;
  error: string | null = null;
  initialized = false;

  constructor() {
    makeAutoObservable(this);
    // Load persisted selected theme ids from localStorage (client-only)
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('cortexex_selectedThemes');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.selectedThemeIds = parsed;
          }
        }

        // Persist changes to selectedThemeIds
        autorun(() => {
          try {
            localStorage.setItem('cortexex_selectedThemes', JSON.stringify(this.selectedThemeIds || []));
          } catch (err) {
            // ignore storage errors
          }
        });
      }
    } catch (err) {
      // ignore any parsing/storage errors
    }
  }

  async fetchThemes() {
    this.loading = true;
    this.error = null;
    try {
      const themes = await api.fetchThemes();
      runInAction(() => {
        this.themes = themes;
        this.loading = false;
        this.initialized = true;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch themes';
        this.loading = false;
        this.initialized = true;
      });
    }
  }

  async addTheme(theme: CreateThemeDto) {
    this.loading = true;
    this.error = null;
    try {
      const newTheme = await api.createTheme(theme);
      runInAction(() => {
        this.themes = [...this.themes, newTheme];
        this.loading = false;
      });
      return newTheme;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create theme';
        this.loading = false;
      });
      throw error;
    }
  }

  async updateTheme(id: string, updates: UpdateThemeDto) {
    this.loading = true;
    this.error = null;
    try {
      const updatedTheme = await api.updateTheme(id, updates);
      runInAction(() => {
        this.themes = this.themes.map((theme) =>
          theme.id === id ? updatedTheme : theme
        );
        this.loading = false;
      });
      return updatedTheme;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to update theme';
        this.loading = false;
      });
      throw error;
    }
  }

  async deleteTheme(id: string) {
    this.loading = true;
    this.error = null;
    try {
      await api.deleteTheme(id);
      runInAction(() => {
        this.themes = this.themes.filter((theme) => theme.id !== id);
        this.selectedThemeIds = this.selectedThemeIds.filter((selectedId) => selectedId !== id);
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to delete theme';
        this.loading = false;
      });
      throw error;
    }
  }

  toggleTheme(themeId: string) {
    if (this.selectedThemeIds.includes(themeId)) {
      this.selectedThemeIds = this.selectedThemeIds.filter((id) => id !== themeId);
    } else {
      this.selectedThemeIds = [...this.selectedThemeIds, themeId];
    }
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

}

export const themeStore = new ThemeStore();

