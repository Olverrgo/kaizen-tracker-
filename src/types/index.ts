import { Timestamp } from 'firebase/firestore';

// Category types
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  hourlyRateDefault: number;
  createdAt: Timestamp;
}

// Image attachment type
export interface ImageAttachment {
  id: string;
  data: string; // base64 encoded image
  name: string;
  type: string;
  addedAt: Date;
}

// Custom phase for projects
export interface CustomPhase {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
}

// Project status
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'cancelled';

// Project types
export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  phases: CustomPhase[]; // Custom phases for this project
  currentPhaseId: string; // ID of current phase
  status: ProjectStatus;
  expectedIncome: number; // Ingreso esperado del proyecto
  actualIncome: number; // Ingreso real acumulado
  totalCosts: number; // Costos acumulados
  totalMinutes: number; // Tiempo total invertido
  targetDate?: string; // Fecha objetivo (YYYY-MM-DD)
  notes?: string;
  images?: ImageAttachment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Phase templates for quick setup
export interface PhaseTemplate {
  id: string;
  name: string;
  description: string;
  phases: Omit<CustomPhase, 'id'>[];
}

// Activity types
export interface Activity {
  id: string;
  categoryId: string;
  projectId?: string; // Optional link to a project
  name: string;
  description: string;
  startTime: Timestamp;
  endTime: Timestamp | null;
  durationMinutes: number;
  income: number;
  costs: number;
  profit: number;
  isProductive: boolean;
  wasteReason?: string;
  notes?: string; // Detailed notes about the activity
  images?: ImageAttachment[]; // Array of attached images
  createdAt: Timestamp;
}

// For creating new activities (without id and timestamps)
export interface ActivityInput {
  categoryId: string;
  name: string;
  description?: string;
  income: number;
  costs: number;
  isProductive: boolean;
  wasteReason?: string;
}

// Daily goal types
export interface DailyGoal {
  id: string;
  date: string; // YYYY-MM-DD format
  targetProfit: number;
  actualProfit: number;
  achievementPercentage: number;
  productiveHours: number;
  wastedHours: number;
  notes: string;
  createdAt: Timestamp;
}

// Kaizen improvement types
export interface KaizenImprovement {
  id: string;
  date: string;
  improvementDescription: string;
  category: string;
  impactPercentage: number;
  createdAt: Timestamp;
}

// Timer state
export interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  currentActivityId: string | null;
}

// User settings
export interface UserSettings {
  dailyProfitTarget: number; // Default: 500
  workingHoursPerDay: number; // Default: 8
  currency: string; // Default: 'MXN'
  aiCoachEnabled?: boolean; // Default: true
}

// Dashboard metrics
export interface DailyMetrics {
  date: string;
  totalProfit: number;
  totalIncome: number;
  totalCosts: number;
  productiveMinutes: number;
  wastedMinutes: number;
  activitiesCount: number;
  goalAchievement: number; // percentage
}

// For charts
export interface ChartDataPoint {
  date: string;
  profit: number;
  target: number;
  achievement: number;
}

// User type
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Auth state
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
