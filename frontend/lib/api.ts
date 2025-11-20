const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function parseError(response: Response, fallbackMessage: string) {
  try {
    const error = await response.json();
    throw new Error(error.message || fallbackMessage);
  } catch {
    throw new Error(fallbackMessage);
  }
}

export async function register(name: string, password: string) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Важно для cookies
    body: JSON.stringify({ name, password }),
  });

  if (!response.ok) {
    await parseError(response, 'Registration failed');
  }

  return response.json();
}

export async function login(name: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Важно для cookies
    body: JSON.stringify({ name, password }),
  });

  if (!response.ok) {
    await parseError(response, 'Login failed');
  }

  return response.json();
}

export async function fetchProfile() {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    await parseError(response, 'Failed to load profile');
  }

  return response.json();
}

export async function logout() {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    await parseError(response, 'Logout failed');
  }

  return response.json();
}

