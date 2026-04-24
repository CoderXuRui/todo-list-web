import { useState } from 'react';
import { useTaskStore } from '../stores/taskStore';

interface CategoryFilterProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const { categories } = useTaskStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    const colors = ['#FF8A8A', '#B5DEFF', '#A8E6CF', '#D4A5FF', '#FFD93D', '#FFCBA4'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    useTaskStore.getState().addCategory(newName.trim(), color);
    setNewName('');
    setShowAdd(false);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        {/* All filter */}
        <button
          onClick={() => onSelect('all')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
            selected === 'all'
              ? 'bg-gray-700 dark:bg-gray-600 text-white shadow-soft'
              : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          全部
        </button>

        {/* Category filters */}
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              selected === cat.id
                ? 'scale-105 shadow-soft'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: selected === cat.id ? cat.color : `${cat.color}30`,
              color: selected === cat.id ? 'white' : '#4a4a4a',
            }}
          >
            {cat.name}
          </button>
        ))}

        {/* Add category */}
        {showAdd ? (
          <div className="flex items-center gap-2 animate-pop">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="分类名"
              className="w-24 px-3 py-2 text-sm rounded-full border-2 border-lavender bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 outline-none"
              autoFocus
            />
            <button
              onClick={handleAdd}
              className="p-2 rounded-full bg-lavender text-white hover:bg-opacity-80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-cream dark:hover:bg-gray-700 hover:text-lavender transition-all duration-200 shadow-soft"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
