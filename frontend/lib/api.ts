import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function handleError(error: unknown, fallbackMessage: string): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message = axiosError.response?.data?.message || fallbackMessage;
    throw new Error(message);
  }
  throw new Error(fallbackMessage);
}

export async function register(name: string, password: string) {
  try {
    const response = await apiClient.post('/auth/register', { name, password });
    return response.data;
  } catch (error) {
    handleError(error, 'Registration failed');
  }
}

export async function login(name: string, password: string) {
  try {
    const response = await apiClient.post('/auth/login', { name, password });
    return response.data;
  } catch (error) {
    handleError(error, 'Login failed');
  }
}

export async function fetchProfile() {
  try {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        throw new Error('Unauthorized');
      }
    }
    handleError(error, 'Failed to load profile');
  }
}

export async function logout() {
  try {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  } catch (error) {
    handleError(error, 'Logout failed');
  }
}

//TODO: Config tailwind varuables (colors, background, etc) 
//TODO: Make nested lists for themes
