export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  category: string;
  priority: Priority;
  deadline: string | null;
  completed: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Settings {
  lastUpdated: string;
}
