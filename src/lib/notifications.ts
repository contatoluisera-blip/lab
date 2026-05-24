export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: string;
}

export function getNotifications(userId: string): NotificationItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(`asa_notifications_${userId}`);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Erro ao buscar notificações:', e);
    return [];
  }
}

export function saveNotifications(userId: string, list: NotificationItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`asa_notifications_${userId}`, JSON.stringify(list));
    window.dispatchEvent(new Event('asa-notifications-updated'));
  } catch (e) {
    console.error('Erro ao salvar notificações:', e);
  }
}

export function addNotification(
  userId: string, 
  title: string, 
  message: string, 
  type: 'info' | 'success' | 'warning' = 'success'
) {
  const current = getNotifications(userId);
  const newItem: NotificationItem = {
    id: Math.random().toString(36).substring(2, 9),
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  // Add to the top of the list
  const updated = [newItem, ...current];
  saveNotifications(userId, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('asa-new-notification', { detail: newItem }));
  }
}

export function markAllAsRead(userId: string) {
  const current = getNotifications(userId);
  const updated = current.map(item => ({ ...item, read: true }));
  saveNotifications(userId, updated);
}

export function clearNotifications(userId: string) {
  saveNotifications(userId, []);
}
