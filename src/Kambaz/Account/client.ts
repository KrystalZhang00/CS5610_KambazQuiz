const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  dob?: string;
  role: 'STUDENT' | 'FACULTY' | 'TA' | 'ADMIN';
  loginId: string;
  section: string;
  lastActivity: string;
  totalActivity: string;
}

export interface SigninCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  password: string;
  verifyPassword: string;
  firstName: string;
  lastName: string;
  email: string;
  dob?: string;
  role?: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  dob?: string;
}

// Authentication API calls
export const signin = async (credentials: SigninCredentials): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for session
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signin failed');
  }

  return response.json();
};

export const signup = async (userData: SignupData): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for session
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signup failed');
  }

  return response.json();
};

export const getProfile = async (): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: 'GET',
    credentials: 'include', // Include cookies for session
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get profile');
  }

  return response.json();
};

export const updateProfile = async (profileData: ProfileUpdateData): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for session
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile');
  }

  return response.json();
};

export const logout = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include', // Include cookies for session
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Logout failed');
  }
};

export const checkAuth = async (): Promise<{ authenticated: boolean; user?: User }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/check`, {
      method: 'GET',
      credentials: 'include', // Include cookies for session
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    return response.json();
  } catch (error) {
    console.error('Auth check failed:', error);
    return { authenticated: false };
  }
}; 