# React Component Architecture Plan

This document outlines the complete React component architecture for the Gaming Platform frontend, including TypeScript interfaces, state management, and integration patterns.

## Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── AuthGuard.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   └── index.ts
│   │   ├── dashboard/
│   │   │   ├── WelcomeCard.tsx
│   │   │   ├── BalanceCard.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   └── index.ts
│   │   ├── games/
│   │   │   ├── GameLobby.tsx
│   │   │   ├── CreateGameForm.tsx
│   │   │   ├── GameCard.tsx
│   │   │   ├── GameInterface/
│   │   │   │   ├── DrawGame.tsx
│   │   │   │   ├── PoolGame.tsx
│   │   │   │   │   └── BlackjackGame.tsx
│   │   │   └── index.ts
│   │   ├── tournaments/
│   │   │   ├── TournamentLobby.tsx
│   │   │   ├── TournamentCard.tsx
│   │   │   ├── TournamentBracket.tsx
│   │   │   ├── CreateTournamentForm.tsx
│   │   │   └── index.ts
│   │   ├── wallet/
│   │   │   ├── WalletDashboard.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   ├── DepositForm.tsx
│   │   │   ├── WithdrawForm.tsx
│   │   │   └── index.ts
│   │   ├── admin/
│   │   │   ├── AdminPanel.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   ├── GameManagement.tsx
│   │   │   └── index.ts
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── index.ts
│   │   └── common/
│   │       ├── Navbar.tsx
│   │       ├── Footer.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWallet.ts
│   │   ├── useGames.ts
│   │   ├── useTournaments.ts
│   │   ├── useLocalStorage.ts
│   │   └── index.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── WalletContext.tsx
│   │   ├── GameContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── index.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Games.tsx
│   │   ├── GamePlay.tsx
│   │   ├── Tournaments.tsx
│   │   ├── Wallet.tsx
│   │   ├── Profile.tsx
│   │   ├── NotFound.tsx
│   │   └── index.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── wallet.ts
│   │   ├── games.ts
│   │   ├── tournaments.ts
│   │   ├── payments.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── wallet.ts
│   │   ├── games.ts
│   │   ├── tournaments.ts
│   │   ├── payments.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── storage.ts
│   │   └── index.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## TypeScript Interfaces

### Auth Types (`src/types/auth.ts`)
```typescript
export interface User {
  id: number;
  username: string;
  email?: string;
  phone_number: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
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
```

### Wallet Types (`src/types/wallet.ts`)
```typescript
export interface WalletBalance {
  available: number;
  locked: number;
  total: number;
}

export interface Transaction {
  id: number;
  amount: number;
  direction: 'credit' | 'debit';
  tx_type: 'deposit' | 'withdrawal' | 'game_win' | 'game_loss' | 'tournament_entry' | 'tournament_win';
  status: 'pending' | 'success' | 'failed';
  description: string;
  created_at: string;
  reference?: string;
}

export interface WalletState {
  balance: WalletBalance;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

export interface DepositRequest {
  amount: number;
}

export interface WithdrawRequest {
  amount: number;
  phone_number: string;
}
```

### Game Types (`src/types/games.ts`)
```typescript
export interface Game {
  id: number;
  game_code: string;
  game_type: 'draw_1v1' | 'pool_8ball' | 'card_blackjack';
  stake_amount: number;
  total_pot: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  creator_id: number;
}

export interface GameEntry {
  id: number;
  user_id: number;
  game_id: number;
  stake_amount: number;
  joined_at: string;
  result?: 'win' | 'loss' | 'draw';
  payout_amount?: number;
}

export interface GameDetails {
  game: Game;
  entries: Array<GameEntry & { username: string }>;
  winner?: { user_id: number; username: string };
}

export interface CreateGameRequest {
  game_type: Game['game_type'];
  stake_amount: number;
  is_free?: boolean;
}

export interface JoinGameRequest {
  game_id: number;
}

export interface GameState {
  games: Game[];
  myGames: Game[];
  currentGame: GameDetails | null;
  isLoading: boolean;
  error: string | null;
}
```

### Tournament Types (`src/types/tournaments.ts`)
```typescript
export interface Tournament {
  id: number;
  name: string;
  game_type: 'draw_1v1' | 'pool_8ball' | 'card_blackjack';
  entry_fee: number;
  max_players: number;
  status: 'open' | 'in_progress' | 'completed';
  winner_id?: number;
  game_id?: number;
  created_at: string;
}

export interface TournamentEntry {
  id: number;
  tournament_id: number;
  user_id: number;
  joined_at: string;
  status: 'active' | 'eliminated' | 'winner';
}

export interface TournamentMatch {
  player1?: string;
  player2?: string;
  winner?: string;
}

export interface TournamentRound {
  round: number;
  matches: TournamentMatch[];
}

export interface TournamentDetails {
  tournament: Tournament;
  entries: Array<TournamentEntry & { username: string }>;
  bracket: TournamentRound[];
}

export interface CreateTournamentRequest {
  name: string;
  game_type: Tournament['game_type'];
  entry_fee: number;
  max_players: number;
  format: 'single_elimination' | 'double_elimination';
}

export interface TournamentState {
  tournaments: Tournament[];
  myTournaments: Tournament[];
  currentTournament: TournamentDetails | null;
  isLoading: boolean;
  error: string | null;
}
```

## Context Providers

### AuthContext (`src/contexts/AuthContext.tsx`)
```typescript
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, RegisterCredentials } from '../types/auth';
import { authAPI } from '../services/auth';
import { storage } from '../utils/storage';

interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN'; payload: string };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'REFRESH_TOKEN':
      return { ...state, token: action.payload };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: storage.getItem('auth_token'),
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await authAPI.login(credentials);
      storage.setItem('auth_token', response.token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await authAPI.register(credentials);
      storage.setItem('auth_token', response.token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
    }
  };

  const logout = () => {
    storage.removeItem('auth_token');
    dispatch({ type: 'LOGOUT' });
  };

  const refreshToken = async () => {
    try {
      const newToken = await authAPI.refreshToken();
      storage.setItem('auth_token', newToken);
      dispatch({ type: 'REFRESH_TOKEN', payload: newToken });
    } catch (error) {
      logout();
    }
  };

  // Auto-login on app start if token exists
  useEffect(() => {
    const token = storage.getItem('auth_token');
    if (token && !state.user) {
      authAPI.verifyToken(token)
        .then(response => {
          dispatch({ type: 'LOGIN_SUCCESS', payload: response });
        })
        .catch(() => {
          storage.removeItem('auth_token');
          dispatch({ type: 'LOGOUT' });
        });
    }
  }, []);

  const value = { state, login, register, logout, refreshToken };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### GameContext (`src/contexts/GameContext.tsx`)
```typescript
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameDetails, GameState } from '../types/games';
import { gameAPI } from '../services/games';

interface GameContextType {
  state: GameState;
  loadGames: () => Promise<void>;
  loadMyGames: () => Promise<void>;
  loadGameDetails: (gameId: number) => Promise<void>;
  createGame: (gameData: any) => Promise<GameDetails>;
  joinGame: (gameId: number) => Promise<void>;
  startGame: (gameId: number) => Promise<void>;
  cancelGame: (gameId: number) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

type GameAction =
  | { type: 'LOAD_GAMES_START' }
  | { type: 'LOAD_GAMES_SUCCESS'; payload: GameDetails[] }
  | { type: 'LOAD_GAMES_FAILURE'; payload: string }
  | { type: 'SET_CURRENT_GAME'; payload: GameDetails }
  | { type: 'UPDATE_GAME'; payload: GameDetails };

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'LOAD_GAMES_START':
      return { ...state, isLoading: true, error: null };
    case 'LOAD_GAMES_SUCCESS':
      return { ...state, games: action.payload, isLoading: false, error: null };
    case 'LOAD_GAMES_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    case 'SET_CURRENT_GAME':
      return { ...state, currentGame: action.payload };
    case 'UPDATE_GAME':
      return {
        ...state,
        games: state.games.map(game =>
          game.id === action.payload.game.id ? action.payload : game
        ),
        currentGame: state.currentGame?.id === action.payload.game.id ? action.payload : state.currentGame,
      };
    default:
      return state;
  }
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, {
    games: [],
    myGames: [],
    currentGame: null,
    isLoading: false,
    error: null,
  });

  const loadGames = async () => {
    try {
      dispatch({ type: 'LOAD_GAMES_START' });
      const games = await gameAPI.getOpenGames();
      dispatch({ type: 'LOAD_GAMES_SUCCESS', payload: games });
    } catch (error) {
      dispatch({ type: 'LOAD_GAMES_FAILURE', payload: error.message });
    }
  };

  const loadMyGames = async () => {
    const myGames = await gameAPI.getMyGames();
    // Update state with myGames
  };

  const loadGameDetails = async (gameId: number) => {
    const gameDetails = await gameAPI.getGameDetails(gameId);
    dispatch({ type: 'SET_CURRENT_GAME', payload: gameDetails });
  };

  const createGame = async (gameData: any) => {
    const newGame = await gameAPI.createGame(gameData);
    dispatch({ type: 'SET_CURRENT_GAME', payload: newGame });
    return newGame;
  };

  const joinGame = async (gameId: number) => {
    const updatedGame = await gameAPI.joinGame(gameId);
    dispatch({ type: 'UPDATE_GAME', payload: updatedGame });
  };

  const startGame = async (gameId: number) => {
    const updatedGame = await gameAPI.startGame(gameId);
    dispatch({ type: 'UPDATE_GAME', payload: updatedGame });
  };

  const cancelGame = async (gameId: number) => {
    await gameAPI.cancelGame(gameId);
    await loadGames(); // Refresh the games list
  };

  const value = {
    state,
    loadGames,
    loadMyGames,
    loadGameDetails,
    createGame,
    joinGame,
    startGame,
    cancelGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
```

## Custom Hooks

### useAuth Hook (`src/hooks/useAuth.ts`)
```typescript
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### useWallet Hook (`src/hooks/useWallet.ts`)
```typescript
import { useReducer, useEffect } from 'react';
import { WalletState, Transaction } from '../types/wallet';
import { walletAPI } from '../services/wallet';

const initialState: WalletState = {
  balance: { available: 0, locked: 0, total: 0 },
  transactions: [],
  isLoading: false,
  error: null,
};

type WalletAction =
  | { type: 'LOAD_BALANCE_START' }
  | { type: 'LOAD_BALANCE_SUCCESS'; payload: { balance: any; transactions: Transaction[] } }
  | { type: 'LOAD_BALANCE_FAILURE'; payload: string }
  | { type: 'UPDATE_BALANCE'; payload: { available: number; locked: number } }
  | { type: 'ADD_TRANSACTION'; payload: Transaction };

const walletReducer = (state: WalletState, action: WalletAction): WalletState => {
  switch (action.type) {
    case 'LOAD_BALANCE_START':
      return { ...state, isLoading: true, error: null };
    case 'LOAD_BALANCE_SUCCESS':
      return {
        ...state,
        balance: action.payload.balance,
        transactions: action.payload.transactions,
        isLoading: false,
        error: null,
      };
    case 'LOAD_BALANCE_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    case 'UPDATE_BALANCE':
      return {
        ...state,
        balance: {
          ...state.balance,
          available: action.payload.available,
          locked: action.payload.locked,
          total: action.payload.available + action.payload.locked,
        },
      };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    default:
      return state;
  }
};

export const useWallet = () => {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  const loadWalletData = async () => {
    try {
      dispatch({ type: 'LOAD_BALANCE_START' });
      const { balance, transactions } = await walletAPI.getWalletData();
      dispatch({ type: 'LOAD_BALANCE_SUCCESS', payload: { balance, transactions } });
    } catch (error) {
      dispatch({ type: 'LOAD_BALANCE_FAILURE', payload: error.message });
    }
  };

  const deposit = async (amount: number) => {
    const result = await walletAPI.deposit(amount);
    if (result.status === 'success') {
      await loadWalletData(); // Refresh wallet data
    }
    return result;
  };

  const withdraw = async (amount: number, phoneNumber: string) => {
    const result = await walletAPI.withdraw(amount, phoneNumber);
    if (result.status === 'success') {
      await loadWalletData(); // Refresh wallet data
    }
    return result;
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  return {
    state,
    loadWalletData,
    deposit,
    withdraw,
  };
};
```

### useLocalStorage Hook (`src/hooks/useLocalStorage.ts`)
```typescript
import { useState, useEffect } from 'react';

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue] as const;
};
```

## API Services

### API Client (`src/services/api.ts`)
```typescript
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { storage } from '../utils/storage';
import { notificationAPI } from './notifications';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = storage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          storage.removeItem('auth_token');
          window.location.href = '/login';
        }
        
        if (error.response?.status >= 500) {
          // Server error
          notificationAPI.showError('Server error. Please try again later.');
        }

        return Promise.reject(error);
      }
    );
  }

  public get(url: string, config = {}) {
    return this.client.get(url, config);
  }

  public post(url: string, data?: any, config = {}) {
    return this.client.post(url, data, config);
  }

  public put(url: string, data?: any, config = {}) {
    return this.client.put(url, data, config);
  }

  public delete(url: string, config = {}) {
    return this.client.delete(url, config);
  }

  public patch(url: string, data?: any, config = {}) {
    return this.client.patch(url, data, config);
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api');
```

### Auth Service (`src/services/auth.ts`)
```typescript
import { apiClient } from './api';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../types/auth';

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  verifyToken: async (token: string): Promise<AuthResponse> => {
    const response = await apiClient.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  refreshToken: async (): Promise<string> => {
    const response = await apiClient.post('/auth/refresh');
    return response.data.token;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data.user;
  },
};
```

## Component Patterns

### Error Boundary Component
```tsx
// src/components/ErrorBoundary.tsx
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} />;
      }
      
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Loading Component
```tsx
// src/components/ui/LoadingSpinner.tsx
import React from 'react';
import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <svg
      className={cn(
        'animate-spin text-current',
        sizeClasses[size],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};
```

This architecture provides a solid foundation for building the React frontend with:
- **TypeScript interfaces** for type safety
- **Context providers** for state management
- **Custom hooks** for data fetching and business logic
- **API services** for backend communication
- **Error boundaries** for graceful error handling
- **Reusable UI components** for consistent design
- **Proper separation of concerns** for maintainability

The next step is to implement these components and integrate them with the Tailwind CSS styling system.