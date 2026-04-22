import { useTaskStore } from '../stores/taskStore';

export function Stats() {
  const { tasks } = useTaskStore();

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {/* Total */}
      <div className="bg-white rounded-2xl p-5 shadow-soft text-center animate-slide-up">
        <div className="text-3xl mb-1">{total}</div>
        <div className="text-sm text-gray-400 font-medium">总任务</div>
      </div>

      {/* Completed */}
      <div className="bg-white rounded-2xl p-5 shadow-soft text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="text-3xl mb-1 text-mint">{completed}</div>
        <div className="text-sm text-gray-400 font-medium">已完成</div>
      </div>

      {/* Rate */}
      <div className="bg-gradient-to-br from-blush to-coral rounded-2xl p-5 shadow-soft text-center text-white animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="text-3xl mb-1 font-display font-bold">{rate}%</div>
        <div className="text-sm opacity-80 font-medium">完成率</div>
      </div>
    </div>
  );
}
