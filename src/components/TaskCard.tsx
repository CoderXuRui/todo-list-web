import { useState, useRef } from 'react';
import { useTaskStore } from '../stores/taskStore';
import type { Task } from '../types';
import { formatDate, getPriorityColor } from '../utils/date';
import { playCompleteSound, playSubtaskCompleteSound } from '../utils/sound';
import { useCelebration } from '../hooks/useCelebration';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  viewMode?: 'tasks' | 'trash';
  onRestore?: () => void;
  onPermanentDelete?: () => void;
}

export function TaskCard({ task, onEdit, viewMode = 'tasks', onRestore, onPermanentDelete }: TaskCardProps) {
  const { toggleTask, deleteTask, categories, toggleSubtask, deleteSubtask, addSubtask } = useTaskStore();
  const [expanded, setExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const checkboxRef = useRef<HTMLButtonElement>(null);
  const { particles, trigger } = useCelebration();

  const category = categories.find((c) => c.id === task.category);
  const completedSubtasks = task.subtasks.filter((st) => st.completed).length;
  const totalSubtasks = task.subtasks.length;
  const isTrash = viewMode === 'trash';

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    addSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
  };

  return (
    <div
      className={`group bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-soft hover:shadow-lift transition-all duration-300 animate-slide-up ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox (only in tasks view) */}
        {!isTrash && (
          <button
            ref={checkboxRef}
            onClick={() => {
              if (!task.completed) {
                playCompleteSound();
                trigger(checkboxRef.current);
              }
              toggleTask(task.id);
            }}
            className={`flex-shrink-0 w-8 h-8 rounded-full border-4 transition-all duration-300 flex items-center justify-center ${
              task.completed
                ? 'bg-mint border-mint scale-110 shadow-md'
                : 'border-blush hover:border-coral hover:scale-110 bg-white dark:bg-gray-800'
            }`}
          >
            {task.completed && (
              <span className="text-white text-lg font-bold animate-pop">✓</span>
            )}
          </button>
        )}

        {/* Celebration particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="fixed pointer-events-none z-50"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: '50%',
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        ))}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-display font-bold text-lg transition-all duration-200 ${
                task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'
              }`}
            >
              {task.title}
            </h3>

            {/* Subtask toggle (only in tasks view) */}
            {!isTrash && (
              <button
                onClick={() => setExpanded(!expanded)}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  expanded
                    ? 'bg-lavender text-white'
                    : 'bg-lavender/20 text-lavender hover:bg-lavender/30'
                }`}
              >
                📋 子任务 {totalSubtasks > 0 && `${completedSubtasks}/${totalSubtasks}`}
              </button>
            )}
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
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getPriorityColor(task.priority) }}
              />
              {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
            </span>

            {/* Deadline */}
            {task.deadline && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                📅 {formatDate(task.deadline)}
              </span>
            )}

            {/* Deleted at (trash view) */}
            {isTrash && task.deletedAt && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                🗑️ {formatDate(task.deletedAt)}
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 bg-cream/50 dark:bg-gray-700/50 rounded-lg p-3">
              📝 {task.description}
            </div>
          )}

          {/* Subtasks (only in tasks view) */}
          {!isTrash && expanded && (
            <div className="mt-4 space-y-2 animate-fade-in">
              {task.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-3 pl-2 py-1 rounded-lg hover:bg-cream/50 dark:hover:bg-gray-700/50 group/subtask"
                >
                  <button
                    onClick={() => {
                      if (!subtask.completed) {
                        playSubtaskCompleteSound();
                      }
                      toggleSubtask(task.id, subtask.id);
                    }}
                    className={`w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center flex-shrink-0 ${
                      subtask.completed
                        ? 'bg-mint border-mint'
                        : 'border-blush/50 hover:border-blush bg-white dark:bg-gray-800'
                    }`}
                  >
                    {subtask.completed && (
                      <span className="text-white text-xs font-bold">✓</span>
                    )}
                  </button>
                  <span
                    className={`text-sm flex-1 transition-all duration-200 ${
                      subtask.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask(task.id, subtask.id)}
                    className="opacity-0 group-hover/subtask:opacity-100 p-1 rounded hover:bg-coral/20 text-gray-400 hover:text-coral transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Add subtask form */}
              <form onSubmit={handleAddSubtask} className="flex items-center gap-3 pl-2 pt-1">
                <div className="w-5 h-5 rounded-full border-2 border-dashed border-lavender/40" />
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="添加子任务..."
                  className="flex-1 text-sm bg-transparent outline-none text-gray-600 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                <button
                  type="submit"
                  disabled={!newSubtask.trim()}
                  className="text-xs px-3 py-1 rounded-full bg-lavender/20 text-lavender hover:bg-lavender/30 disabled:opacity-50 transition-colors"
                >
                  添加
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isTrash && onEdit && (
            <>
              <button
                onClick={() => onEdit(task)}
                className="p-2 rounded-lg hover:bg-cream dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-lavender"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                className="p-2 rounded-lg hover:bg-cream dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-coral"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
          {isTrash && onRestore && (
            <button
              onClick={onRestore}
              className="p-2 rounded-lg hover:bg-cream dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-mint"
              title="恢复任务"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          {isTrash && onPermanentDelete && (
            <button
              onClick={onPermanentDelete}
              className="p-2 rounded-lg hover:bg-cream dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-coral"
              title="永久删除"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
