import { useTaskStore } from '../stores/taskStore';
import type { Task } from '../types';
import { formatDate, getPriorityColor } from '../utils/date';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const { toggleTask, deleteTask, categories } = useTaskStore();
  const category = categories.find((c) => c.id === task.category);

  return (
    <div
      className={`group bg-white rounded-2xl p-5 shadow-soft hover:shadow-lift transition-all duration-300 animate-slide-up ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={() => toggleTask(task.id)}
          className={`flex-shrink-0 w-7 h-7 rounded-full border-3 transition-all duration-300 flex items-center justify-center ${
            task.completed
              ? 'bg-mint border-mint scale-110'
              : 'border-blush hover:border-coral hover:scale-110'
          }`}
        >
          {task.completed && (
            <span className="text-white text-sm animate-pop">✓</span>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-display font-bold text-lg transition-all duration-200 ${
                task.completed ? 'line-through text-gray-400' : 'text-gray-700'
              }`}
            >
              {task.title}
            </h3>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Category badge */}
            {category && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `${category.color}30`,
                  color: category.color,
                }}
              >
                {category.name}
              </span>
            )}

            {/* Priority indicator */}
            <span
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-400"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getPriorityColor(task.priority) }}
              />
              {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
            </span>

            {/* Deadline */}
            {task.deadline && (
              <span className="text-xs text-gray-400">
                📅 {formatDate(task.deadline)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-2 rounded-lg hover:bg-cream transition-colors text-gray-400 hover:text-lavender"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="p-2 rounded-lg hover:bg-cream transition-colors text-gray-400 hover:text-coral"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
