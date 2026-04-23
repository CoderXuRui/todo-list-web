import { useState, useMemo } from 'react';
import { useTaskStore } from './stores/taskStore';
import { Stats } from './components/Stats';
import { CategoryFilter } from './components/CategoryFilter';
import { TaskCard } from './components/TaskCard';
import { TaskForm } from './components/TaskForm';
import type { Task, Priority } from './types';

type SortKey = 'date' | 'priority' | 'created';
type SortOrder = 'asc' | 'desc';

function App() {
  const { tasks } = useTaskStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter((t) => t.category === filterCategory);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'date':
          if (!a.deadline && !b.deadline) cmp = 0;
          else if (!a.deadline) cmp = 1;
          else if (!b.deadline) cmp = -1;
          else cmp = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
        case 'priority':
          const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
          cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'created':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    // Put incomplete tasks first
    result.sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });

    return result;
  }, [tasks, filterCategory, sortKey, sortOrder]);

  return (
    <div className="min-h-screen bg-cream">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blush/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-mint/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-lavender/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main container */}
      <div className="relative max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center gap-3 mb-2">
            <span className="text-4xl">📝</span>
            <h1 className="font-display text-4xl font-extrabold bg-gradient-to-r from-coral via-blush to-lavender bg-clip-text text-transparent">
              Bloom Todo
            </h1>
            <span className="text-4xl">✨</span>
          </div>
          <p className="text-gray-400 font-medium">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </header>

        {/* Stats */}
        <Stats />

        {/* Category Filter */}
        <CategoryFilter selected={filterCategory} onSelect={setFilterCategory} />

        {/* Sort controls */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400 font-medium">
            共 {filteredTasks.length} 个任务
          </span>
          <div className="flex items-center gap-2">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="px-3 py-1.5 text-sm rounded-lg border-2 border-cream bg-white text-gray-600 outline-none focus:border-lavender transition-colors"
            >
              <option value="created">按创建时间</option>
              <option value="date">按截止日期</option>
              <option value="priority">按优先级</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-lg bg-white border-2 border-cream text-gray-400 hover:text-lavender hover:border-lavender transition-all"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="text-6xl mb-4">🎈</div>
              <p className="text-gray-400 font-medium text-lg">
                {tasks.length === 0 ? '还没有任务，添加一个吧~' : '没有符合筛选条件的任务'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => setEditingTask(t)}
              />
            ))
          )}
        </div>

        {/* FAB */}
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-blush to-coral rounded-full shadow-lift flex items-center justify-center text-white text-3xl hover:scale-110 transition-all duration-300 animate-bounce-in"
          style={{ animationDelay: '0.5s' }}
        >
          +
        </button>
      </div>

      {/* Task Form Modal */}
      {showForm && <TaskForm onClose={() => setShowForm(false)} />}

      {/* Edit Modal */}
      {editingTask && (
        <TaskForm onClose={() => setEditingTask(null)} />
      )}
    </div>
  );
}

export default App;
