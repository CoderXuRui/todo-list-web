export type Priority = 'high' | 'medium' | 'low';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  deadline: string | null;
  completed: boolean;
  createdAt: string;
  subtasks: Subtask[];
  deletedAt: string | null;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Settings {
  lastUpdated: string;
}
