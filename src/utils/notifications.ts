// 请求通知权限
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// 发送桌面通知
export function sendNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    new Notification(title, {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      ...options,
    });
  } catch {
    // 忽略通知错误
  }
}

// 番茄钟工作完成通知
export function notifyPomodoroComplete(isWorkMode: boolean) {
  if (isWorkMode) {
    sendNotification('🍅 番茄钟完成！', {
      body: '专注时间结束，休息一下吧~',
      tag: 'pomodoro',
    });
  } else {
    sendNotification('☕ 休息结束！', {
      body: '休息好了吗？继续专注吧~',
      tag: 'pomodoro',
    });
  }
}

// 任务截止提醒
export function notifyTaskDeadline(taskTitle: string) {
  sendNotification('⏰ 任务即将截止', {
    body: `"${taskTitle}" 今天到期，别忘了完成哦~`,
    tag: 'deadline',
  });
}