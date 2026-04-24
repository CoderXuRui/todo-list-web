import { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTaskStore } from './stores/taskStore';
import { usePomodoroStore } from './stores/pomodoroStore';
import { useTheme } from './hooks/useTheme';
import { Stats } from './components/Stats';
import { CategoryFilter } from './components/CategoryFilter';
import { TaskCard } from './components/TaskCard';
import { SortableTaskCard } from './components/SortableTaskCard';
import { TaskForm } from './components/TaskForm';
import { Pomodoro } from './components/Pomodoro';
import type { Task, Priority } from './types';

type SortKey = 'date' | 'priority' | 'created';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'tasks' | 'trash';

function App() {
  const { tasks, restoreTask, permanentDeleteTask, reorderTasks } = useTaskStore();

  const activeTasks = useMemo(() => tasks.filter((t) => t.deletedAt === null), [tasks]);
  const trashedTasks = useMemo(() => tasks.filter((t) => t.deletedAt !== null), [tasks]);
  const { theme, toggleTheme } = useTheme();
  const pomodoro = usePomodoroStore();

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('tasks');
  const [showPomodoro, setShowPomodoro] = useState(false);

  // 番茄钟运行时，每秒刷新按钮上的时间显示
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (!pomodoro.isRunning || showPomodoro) return;
    const id = setInterval(() => forceUpdate((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [pomodoro.isRunning, showPomodoro]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Enable drag only when no filter/search in tasks view
  const canDrag = viewMode === 'tasks' && filterCategory === 'all' && !searchQuery.trim();

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    const source = viewMode === 'tasks' ? activeTasks : trashedTasks;
    let result = [...source];

    // Filter by category
    if (viewMode === 'tasks' && filterCategory !== 'all') {
      result = result.filter((t) => t.category === filterCategory);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.subtasks.some((st) => st.title.toLowerCase().includes(q))
      );
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

    // Put incomplete tasks first (only in tasks view)
    if (viewMode === 'tasks') {
      result.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
    }

    return result;
  }, [activeTasks, trashedTasks, filterCategory, sortKey, sortOrder, searchQuery, viewMode]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTasks(String(active.id), String(over.id));
    }
  };

  const renderTaskList = () => {
    if (filteredTasks.length === 0) {
      return (
        <div className="text-center py-16 animate-fade-in">
          <div className="text-6xl mb-4">
            {viewMode === 'trash' ? '🗑️' : searchQuery ? '🔍' : '🎈'}
          </div>
          <p className="text-gray-400 dark:text-gray-500 font-medium text-lg">
            {viewMode === 'trash'
              ? '回收站是空的'
              : searchQuery
              ? '没有找到匹配的任务'
              : activeTasks.length === 0
              ? '还没有任务，添加一个吧~'
              : '没有符合筛选条件的任务'}
          </p>
        </div>
      );
    }

    if (canDrag) {
      return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onEdit={(t) => setEditingTask(t)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      );
    }

    return (
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={viewMode === 'tasks' ? (t) => setEditingTask(t) : undefined}
            viewMode={viewMode}
            onRestore={viewMode === 'trash' ? () => restoreTask(task.id) : undefined}
            onPermanentDelete={viewMode === 'trash' ? () => permanentDeleteTask(task.id) : undefined}
          />
        ))}
      </div>
    );
  };

  const bgClass = theme === 'dark' ? 'bg-darkBlue' : 'bg-cream';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
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
          <p className="text-gray-400 dark:text-gray-500 font-medium">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </header>

        {/* Theme toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-cream dark:border-gray-700 text-gray-400 dark:text-gray-300 hover:text-lavender dark:hover:text-lavender hover:border-lavender transition-all duration-300 shadow-soft"
            title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>

        {/* View mode tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setViewMode('tasks')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              viewMode === 'tasks'
                ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-soft border-2 border-cream dark:border-gray-700'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            📋 任务 ({activeTasks.length})
          </button>
          <button
            onClick={() => setViewMode('trash')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              viewMode === 'trash'
                ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-soft border-2 border-cream dark:border-gray-700'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            🗑️ 回收站 ({trashedTasks.length})
          </button>
        </div>

        {/* Stats (only in tasks view) */}
        {viewMode === 'tasks' && <Stats />}

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索任务、备注、子任务..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-cream dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-lavender transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter (only in tasks view) */}
        {viewMode === 'tasks' && (
          <CategoryFilter selected={filterCategory} onSelect={setFilterCategory} />
        )}

        {/* Sort controls */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">
            共 {filteredTasks.length} 个{viewMode === 'trash' ? '已删除任务' : '任务'}
          </span>
          <div className="flex items-center gap-2">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="px-3 py-1.5 text-sm rounded-lg border-2 border-cream dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 outline-none focus:border-lavender transition-colors"
            >
              <option value="created">按创建时间</option>
              <option value="date">按截止日期</option>
              <option value="priority">按优先级</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-cream dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-lavender hover:border-lavender transition-all"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Task list */}
        {renderTaskList()}

        {/* Floating action buttons */}
        {viewMode === 'tasks' && (
          <div className="fixed bottom-8 right-8 flex flex-col gap-3">
            <button
              onClick={() => setShowPomodoro(true)}
              className={`w-14 h-14 rounded-full shadow-soft flex items-center justify-center text-2xl hover:scale-110 transition-all duration-300 ${
                pomodoro.isRunning
                  ? pomodoro.mode === 'work'
                    ? 'bg-coral text-white border-2 border-coral animate-pulse'
                    : 'bg-mint text-white border-2 border-mint'
                  : 'bg-white dark:bg-gray-800 border-2 border-cream dark:border-gray-700'
              }`}
              title={pomodoro.isRunning ? `番茄钟 ${pomodoro.mode === 'work' ? '专注中' : '休息中'}` : '番茄钟'}
            >
              {pomodoro.isRunning && !showPomodoro ? (
                <span className="text-xs font-bold">
                  {Math.floor(pomodoro.timeLeft / 60)}:{(pomodoro.timeLeft % 60).toString().padStart(2, '0')}
                </span>
              ) : (
                '🍅'
              )}
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="w-16 h-16 bg-gradient-to-br from-blush to-coral rounded-full shadow-lift flex items-center justify-center text-white text-3xl hover:scale-110 transition-all duration-300 animate-bounce-in"
              style={{ animationDelay: '0.5s' }}
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      {showForm && <TaskForm onClose={() => setShowForm(false)} />}

      {/* Edit Modal */}
      {editingTask && (
        <TaskForm task={editingTask} onClose={() => setEditingTask(null)} />
      )}

      {/* Pomodoro Modal */}
      {showPomodoro && <Pomodoro onClose={() => setShowPomodoro(false)} />}
    </div>
  );
}

export default App;
