// Authentication types for the gaming platform

export interface User {
  id: number;
  username: string;
  email?: string;
  phone_number: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  wallet?: {
    balance: number;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username_or_email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email?: string;
  phone_number: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthError {
  message: string;
  code?: string;
  field?: string;
}