import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Task, Category } from '../types';

interface TaskStore {
  tasks: Task[];
  categories: Category[];

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;

  // Category actions
  addCategory: (name: string, color: string) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Data management
  exportData: () => string;
  importData: (data: string) => boolean;
}

const defaultCategories: Category[] = [
  { id: uuidv4(), name: '工作', color: '#FF8A8A' },
  { id: uuidv4(), name: '学习', color: '#B5DEFF' },
  { id: uuidv4(), name: '生活', color: '#A8E6CF' },
];

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      categories: defaultCategories,

      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...task,
              id: uuidv4(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),

      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          ),
        })),

      addCategory: (name, color) =>
        set((state) => ({
          categories: [
            ...state.categories,
            { id: uuidv4(), name, color },
          ],
        })),

      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, ...updates } : cat
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
          tasks: state.tasks.map((task) =>
            task.category === id ? { ...task, category: '' } : task
          ),
        })),

      exportData: () => {
        const state = get();
        return JSON.stringify({
          tasks: state.tasks,
          categories: state.categories,
          exportedAt: new Date().toISOString(),
        }, null, 2);
      },

      importData: (data) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.tasks && Array.isArray(parsed.tasks)) {
            set({ tasks: parsed.tasks });
          }
          if (parsed.categories && Array.isArray(parsed.categories)) {
            set({ categories: parsed.categories });
          }
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'todo-storage',
    }
  )
);
