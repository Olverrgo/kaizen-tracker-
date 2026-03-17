import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Activity, Category, DailyGoal, TimerState, UserSettings, Project } from '../types';

interface AppState {
  // Activities
  activities: Activity[];
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  addTimeToActivity: (id: string, minutes: number) => void;
  addIncomeToActivity: (id: string, income: number, costs?: number) => void;

  // Categories
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Projects
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addIncomeToProject: (id: string, income: number, costs?: number) => void;
  addTimeToProject: (id: string, minutes: number) => void;

  // Daily Goals
  dailyGoals: DailyGoal[];
  setDailyGoals: (goals: DailyGoal[]) => void;
  updateDailyGoal: (date: string, updates: Partial<DailyGoal>) => void;

  // Timer
  timer: TimerState;
  startTimer: (activityId?: string) => void;
  stopTimer: () => { elapsedSeconds: number };
  pauseTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;

  // User Settings
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;

  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const defaultSettings: UserSettings = {
  dailyProfitTarget: 500,
  workingHoursPerDay: 8,
  currency: 'MXN',
};

const defaultTimer: TimerState = {
  isRunning: false,
  startTime: null,
  elapsedSeconds: 0,
  currentActivityId: null,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Activities
      activities: [],
      setActivities: (activities) => set({ activities }),
      addActivity: (activity) =>
        set((state) => ({ activities: [activity, ...state.activities] })),
      updateActivity: (id, updates) =>
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
      deleteActivity: (id) =>
        set((state) => ({
          activities: state.activities.filter((a) => a.id !== id),
        })),
      addTimeToActivity: (id, minutes) =>
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === id
              ? { ...a, durationMinutes: a.durationMinutes + minutes }
              : a
          ),
        })),
      addIncomeToActivity: (id, income, costs = 0) =>
        set((state) => ({
          activities: state.activities.map((a) => {
            if (a.id !== id) return a;
            const newIncome = a.income + income;
            const newCosts = a.costs + costs;
            return {
              ...a,
              income: newIncome,
              costs: newCosts,
              profit: newIncome - newCosts,
            };
          }),
        })),

      // Categories
      categories: [],
      setCategories: (categories) => set({ categories }),
      addCategory: (category) =>
        set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      // Projects
      projects: [],
      setProjects: (projects) => set({ projects }),
      addProject: (project) =>
        set((state) => ({ projects: [project, ...state.projects] })),
      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() as any } : p
          ),
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),
      addIncomeToProject: (id, income, costs = 0) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              actualIncome: p.actualIncome + income,
              totalCosts: p.totalCosts + costs,
              updatedAt: new Date() as any,
            };
          }),
        })),
      addTimeToProject: (id, minutes) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, totalMinutes: p.totalMinutes + minutes, updatedAt: new Date() as any }
              : p
          ),
        })),

      // Daily Goals
      dailyGoals: [],
      setDailyGoals: (goals) => set({ dailyGoals: goals }),
      updateDailyGoal: (date, updates) =>
        set((state) => ({
          dailyGoals: state.dailyGoals.map((g) =>
            g.date === date ? { ...g, ...updates } : g
          ),
        })),

      // Timer
      timer: defaultTimer,
      startTimer: (activityId) =>
        set({
          timer: {
            isRunning: true,
            startTime: Date.now(),
            elapsedSeconds: get().timer.elapsedSeconds,
            currentActivityId: activityId || null,
          },
        }),
      stopTimer: () => {
        const state = get().timer;
        let elapsed = state.elapsedSeconds;
        if (state.isRunning && state.startTime) {
          elapsed += Math.floor((Date.now() - state.startTime) / 1000);
        }
        set({ timer: defaultTimer });
        return { elapsedSeconds: elapsed };
      },
      pauseTimer: () =>
        set((state) => {
          const t = state.timer;
          let accumulated = t.elapsedSeconds;
          if (t.isRunning && t.startTime) {
            accumulated += Math.floor((Date.now() - t.startTime) / 1000);
          }
          return {
            timer: {
              ...t,
              isRunning: false,
              startTime: null,
              elapsedSeconds: accumulated,
            },
          };
        }),
      resetTimer: () => set({ timer: defaultTimer }),
      tickTimer: () =>
        set((state) => {
          const t = state.timer;
          if (!t.isRunning || !t.startTime) return { timer: t };
          const realElapsed = t.elapsedSeconds + Math.floor((Date.now() - t.startTime) / 1000);
          return {
            timer: {
              ...t,
              elapsedSeconds: realElapsed,
              startTime: Date.now(),
            },
          };
        }),

      // Settings
      settings: defaultSettings,
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      // UI
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'kaizen-storage',
      partialize: (state) => ({
        settings: state.settings,
        categories: state.categories,
        activities: state.activities,
        projects: state.projects,
        timer: state.timer,
      }),
    }
  )
);
