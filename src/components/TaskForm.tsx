import { useState, useRef } from 'react';
import { useTaskStore } from '../stores/taskStore';
import type { Priority } from '../types';
import { getPriorityLabel, getPriorityColor } from '../utils/date';

const priorities: Priority[] = ['high', 'medium', 'low'];

interface TaskFormProps {
  onClose: () => void;
}

export function TaskForm({ onClose }: TaskFormProps) {
  const { categories, addTask } = useTaskStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || '');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      category,
      priority,
      deadline: deadline || null,
      completed: false,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl shadow-bubble p-8 w-full max-w-md animate-bounce-in"
      >
        <h2 className="font-display text-2xl font-bold text-gray-700 mb-6 text-center">
          ✨ 新任务
        </h2>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">
              任务名称
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="今天要做什么呢？"
              className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-lavender bg-cream/30 font-medium transition-all duration-200 outline-none"
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">
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
            <label className="block text-sm font-semibold text-gray-500 mb-2">
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
            <label className="block text-sm font-semibold text-gray-500 mb-2">
              截止日期
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-lavender bg-cream/30 font-medium transition-all duration-200 outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blush to-coral hover:shadow-lift transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            添加 ✨
          </button>
        </div>
      </form>
    </div>
  );
}
