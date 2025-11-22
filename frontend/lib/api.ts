import axios, { AxiosError } from 'axios';
import { CreateThemeDto, Theme, UpdateThemeDto, Question, CreateQuestionDto, UpdateQuestionDto } from './interface';

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


export async function fetchThemes(): Promise<Theme[]> {
  try {
    const response = await apiClient.get('/themes');
    return response.data;
  } catch (error) {
    handleError(error, 'Failed to fetch themes');
  }
}

export async function fetchTheme(id: string): Promise<Theme & { questions?: Question[] }> {
  try {
    const response = await apiClient.get(`/themes/${id}`);
    return response.data;
  } catch (error) {
    handleError(error, 'Failed to fetch theme');
  }
}

export async function createTheme(data: CreateThemeDto): Promise<Theme> {
  try {
    const response = await apiClient.post('/themes', data);
    return response.data;
  } catch (error) {
    handleError(error, 'Failed to create theme');
  }
}

export async function updateTheme(id: string, data: UpdateThemeDto): Promise<Theme> {
  try {
    const response = await apiClient.put(`/themes/${id}`, data);
    return response.data;
  } catch (error) {
    handleError(error, 'Failed to update theme');
  }
}

export async function deleteTheme(id: string): Promise<void> {
  try {
    await apiClient.delete(`/themes/${id}`);
  } catch (error) {
    handleError(error, 'Failed to delete theme');
  }
}

// Question API functions
export async function createQuestion(themeId: string, data: CreateQuestionDto): Promise<Question> {
  try {
    const response = await apiClient.post(`/themes/${themeId}/questions`, data);
    return response.data;
  } catch (error) {
    handleError(error, 'Failed to create question');
  }
}

export async function updateQuestion(themeId: string, questionId: string, data: UpdateQuestionDto): Promise<Question> {
  try {
    const response = await apiClient.put(`/themes/${themeId}/questions/${questionId}`, data);
    return response.data;
  } catch (error) {
    handleError(error, 'Failed to update question');
  }
}

export async function deleteQuestion(themeId: string, questionId: string): Promise<void> {
  try {
    await apiClient.delete(`/themes/${themeId}/questions/${questionId}`);
  } catch (error) {
    handleError(error, 'Failed to delete question');
  }
}
