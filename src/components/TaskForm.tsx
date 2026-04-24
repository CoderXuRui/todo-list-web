import { useState } from 'react';
import { useTaskStore } from '../stores/taskStore';
import type { Priority, Task } from '../types';
import { getPriorityLabel, getPriorityColor } from '../utils/date';

const priorities: Priority[] = ['high', 'medium', 'low'];

interface TaskFormProps {
  onClose: () => void;
  task?: Task | null;
}

export function TaskForm({ onClose, task }: TaskFormProps) {
  const { categories, addTask, updateTask } = useTaskStore();
  const isEditing = !!task;
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [category, setCategory] = useState(task?.category || categories[0]?.id || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  const [deadline, setDeadline] = useState(task?.deadline || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && task) {
      updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        deadline: deadline || null,
      });
    } else {
      addTask({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        deadline: deadline || null,
        completed: false,
        subtasks: [],
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-bubble p-8 w-full max-w-md animate-bounce-in"
      >
        <h2 className="font-display text-2xl font-bold text-gray-700 dark:text-gray-200 mb-6 text-center">
          {isEditing ? '✏️ 编辑任务' : '✨ 新任务'}
        </h2>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
              任务名称
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="今天要做什么呢？"
              className="w-full px-4 py-3 rounded-xl border-2 border-cream dark:border-gray-700 focus:border-lavender bg-cream/30 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 font-medium transition-all duration-200 outline-none"
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
              分类
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    category === cat.id
                      ? 'scale-105 shadow-soft'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: category === cat.id ? cat.color : `${cat.color}30`,
                    color: category === cat.id ? 'white' : '#4a4a4a',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
              优先级
            </label>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    priority === p ? 'scale-105 shadow-soft' : 'opacity-50 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: priority === p ? getPriorityColor(p) : `${getPriorityColor(p)}30`,
                    color: priority === p ? 'white' : '#4a4a4a',
                  }}
                >
                  {getPriorityLabel(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
              截止日期
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream dark:border-gray-700 focus:border-lavender bg-cream/30 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 font-medium transition-all duration-200 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
              备注
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加备注信息..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream dark:border-gray-700 focus:border-lavender bg-cream/30 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 font-medium transition-all duration-200 outline-none resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blush to-coral hover:shadow-lift transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? '保存 ✨' : '添加 ✨'}
          </button>
        </div>
      </form>
    </div>
  );
}
