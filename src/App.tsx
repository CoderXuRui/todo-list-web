import { useState, useMemo, useEffect } from 'react';
import { isThisWeek, parseISO } from 'date-fns';
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
import { requestNotificationPermission, notifyTaskDeadline } from './utils/notifications';
import { Stats } from './components/Stats';
import { QuoteBox } from './components/QuoteBox';
import { CategoryFilter } from './components/CategoryFilter';
import { TaskCard } from './components/TaskCard';
import { SortableTaskCard } from './components/SortableTaskCard';
import { TaskForm } from './components/TaskForm';
import { Pomodoro } from './components/Pomodoro';
import type { Task, Priority } from './types';

type SortKey = 'date' | 'priority' | 'created' | 'manual';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'tasks' | 'trash';

function App() {
  const { tasks, restoreTask, permanentDeleteTask, reorderTasksByOrder } = useTaskStore();

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

  // 启动时检查是否需要发送截止提醒（每天只发一次）
  useEffect(() => {
    const todayKey = `deadline-notify-${new Date().toDateString()}`;
    if (sessionStorage.getItem(todayKey)) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter((t) => !t.completed && t.deletedAt === null && t.deadline && t.deadline <= todayStr);

    if (overdue.length > 0 && Notification.permission === 'granted') {
      notifyTaskDeadline(overdue[0].title);
      sessionStorage.setItem(todayKey, '1');
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Enable drag only when no filter/search in tasks view
  const canDrag = viewMode === 'tasks' && filterCategory === 'all' && !searchQuery.trim();

  // 过期任务：今天截止且未完成
  const overdueTasks = useMemo(() => {
    if (viewMode !== 'tasks') return [];
    const todayStr = new Date().toISOString().split('T')[0];
    return activeTasks.filter((t) => !t.completed && t.deadline && t.deadline <= todayStr);
  }, [activeTasks, viewMode]);

  // 周回顾统计
  const weekStats = useMemo(() => {
    const completedThisWeek = activeTasks.filter(
      (t) => t.completed && t.completedAt && isThisWeek(parseISO(t.completedAt))
    ).length;
    const pomodoroThisWeek = pomodoro.completedAt.filter((ts) => isThisWeek(parseISO(ts))).length;
    return { completedThisWeek, pomodoroThisWeek };
  }, [activeTasks, pomodoro.completedAt]);

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

    // Sort (skip when in manual order mode)
    if (sortKey !== 'manual') {
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

      // Put incomplete tasks first (only in tasks view, not in manual mode)
      if (viewMode === 'tasks') {
        result.sort((a, b) => {
          if (a.completed === b.completed) return 0;
          return a.completed ? 1 : -1;
        });
      }
    }

    return result;
  }, [activeTasks, trashedTasks, filterCategory, sortKey, sortOrder, searchQuery, viewMode]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // 基于当前可见列表 (filteredTasks) 计算新顺序，解决索引不一致问题
    const oldIndex = filteredTasks.findIndex((t) => t.id === active.id);
    const newIndex = filteredTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...filteredTasks];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);

    reorderTasksByOrder(newOrder.map((t) => t.id));
    setSortKey('manual');
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

      {/* 励志语录 - 浮动在左侧 */}
      <QuoteBox />

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

        {/* Theme toggle & Notification */}
        <div className="flex justify-end mb-4 gap-2">
          <button
            onClick={async () => {
              if (Notification.permission === 'granted') return;
              await requestNotificationPermission();
            }}
            className={`p-2.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-cream dark:border-gray-700 transition-all duration-300 shadow-soft ${
              Notification.permission === 'granted'
                ? 'text-mint hover:text-lavender hover:border-lavender'
                : 'text-gray-400 hover:text-lavender hover:border-lavender'
            }`}
            title={Notification.permission === 'granted' ? '通知已开启' : '开启通知'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {Notification.permission === 'granted' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              )}
            </svg>
          </button>
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

        {/* 周回顾 */}
        {viewMode === 'tasks' && (weekStats.completedThisWeek > 0 || weekStats.pomodoroThisWeek > 0) && (
          <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-soft text-sm">
            <span className="text-gray-400 dark:text-gray-500">本周回顾</span>
            {weekStats.completedThisWeek > 0 && (
              <span className="font-semibold text-mint">✅ {weekStats.completedThisWeek} 个任务</span>
            )}
            {weekStats.pomodoroThisWeek > 0 && (
              <span className="font-semibold text-coral">🍅 {weekStats.pomodoroThisWeek} 个番茄钟</span>
            )}
          </div>
        )}

        {/* 过期任务提醒 */}
        {viewMode === 'tasks' && overdueTasks.length > 0 && (
          <div className="mb-4 p-4 bg-coral/10 dark:bg-coral/20 border-2 border-coral/30 rounded-2xl animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⏰</span>
              <span className="font-semibold text-coral dark:text-coral">
                {overdueTasks.length} 个任务今天截止
              </span>
            </div>
            <div className="space-y-1">
              {overdueTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-coral flex-shrink-0" />
                  {task.title}
                </div>
              ))}
              {overdueTasks.length > 3 && (
                <div className="text-xs text-gray-400 dark:text-gray-500 pl-3.5">
                  还有 {overdueTasks.length - 3} 个...
                </div>
              )}
            </div>
          </div>
        )}

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
              <option value="manual">自定义排序</option>
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
