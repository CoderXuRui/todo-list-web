import { useState, useEffect } from 'react';

interface OnboardingGuideProps {
  show?: boolean;
  onClose?: () => void;
}

export function OnboardingGuide({ show: propShow, onClose: propOnClose }: OnboardingGuideProps) {
  const [localShow, setLocalShow] = useState(false);

  // 检查是否是第一次打开
  useEffect(() => {
    const hasSeen = localStorage.getItem('bloom-todo-onboarding');
    if (!hasSeen) {
      setLocalShow(true);
    }
  }, []);

  // 决定是否显示：优先用外部传入的，否则用本地状态
  const show = propShow !== undefined ? propShow : localShow;

  const handleClose = () => {
    localStorage.setItem('bloom-todo-onboarding', 'true');
    setLocalShow(false);
    propOnClose?.();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-bubble p-6 max-w-md w-full animate-bounce-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl font-bold text-gray-700 dark:text-gray-200">
            🌸 欢迎使用 Bloom Todo！
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700" style={{ background: 'linear-gradient(135deg, #fff5f7 0%, #faf5ff 100%)' }}>
            <div className="text-3xl mb-2">📝</div>
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-1">添加任务</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              点击右下角的 + 按钮，或者点击 🍅 旁边的按钮添加新任务。
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #f0fdfa 100%)' }}>
            <div className="text-3xl mb-2">🍅</div>
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-1">番茄钟专注</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              点击 🍅 按钮启动番茄钟，专注 25 分钟，休息 5 分钟，提升效率！
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #fef9c3 100%)' }}>
            <div className="text-3xl mb-2">🏷️</div>
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-1">分类与优先级</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              每个任务可以设置分类（工作/学习/生活）和优先级（高/中/低），更好地管理。
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f0f9ff 100%)' }}>
            <div className="text-3xl mb-2">🌙</div>
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-1">深色/浅色模式</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              点击右上角的月亮/太阳图标切换深色/浅色模式，保护眼睛。
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700" style={{ background: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)' }}>
            <div className="text-3xl mb-2">✨</div>
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-1">更多功能</h3>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>拖拽排序任务</li>
              <li>子任务支持</li>
              <li>过期任务提醒</li>
              <li>PWA 离线可用</li>
              <li>桌面通知</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-pink-400 to-coral-400 hover:from-pink-500 hover:to-coral-500 text-white font-bold text-lg transition-all hover:scale-105 shadow-lg"
          >
            开始使用！🎉
          </button>
        </div>
      </div>
    </div>
  );
}
