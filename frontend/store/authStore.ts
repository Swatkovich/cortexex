import { makeAutoObservable, runInAction } from 'mobx';
import {
  login as loginRequest,
  fetchProfile,
  logout as logoutRequest,
} from '@/lib/api';

export type AuthUser = {
  id: string;
  name: string;
};

class AuthStore {
  user: AuthUser | null = null;
  loading = false;
  initialized = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get isAuthenticated() {
    return Boolean(this.user);
  }

  async hydrate() {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const profile = await fetchProfile();
      runInAction(() => {
        this.user = profile;
      });
    } catch (err) {
      runInAction(() => {
        this.user = null;
        if (err instanceof Error && err.message !== 'Unauthorized') {
          this.error = err.message;
        }
      });
    } finally {
      runInAction(() => {
        this.loading = false;
        this.initialized = true;
      });
    }
  }

  async login(name: string, password: string) {
    await loginRequest(name, password);
    await this.hydrate();
  }

  async logout() {
    try {
      await logoutRequest();
    } catch (err) {
      if (err instanceof Error) {
        console.error('Logout failed:', err.message);
      } else {
        console.error('Logout failed');
      }
    } finally {
      runInAction(() => {
        this.user = null;
        this.initialized = true;
      });
    }
  }
}

export const authStore = new AuthStore();

