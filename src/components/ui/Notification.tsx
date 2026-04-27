import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warn';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextProps {
  notify: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((message: string, type: NotificationType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 50 }}
              className="pointer-events-auto"
            >
              <NotificationItem notification={n} onClose={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

const NotificationItem = ({ notification, onClose }: { notification: Notification, onClose: () => void }) => {
  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
    info: <Info size={18} className="text-blue-500" />,
    warn: <AlertTriangle size={18} className="text-amber-500" />
  };

  const borders = {
    success: 'border-l-emerald-500',
    error: 'border-l-red-500',
    info: 'border-l-blue-500',
    warn: 'border-l-amber-500'
  };

  return (
    <div className={`bg-white border border-slate-200 ${borders[notification.type]} border-l-4 rounded-xl p-4 shadow-2xl min-w-[300px] flex items-center justify-between gap-4`}>
      <div className="flex items-center gap-3">
        {icons[notification.type]}
        <span className="text-sm font-medium text-slate-700">{notification.message}</span>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded">
        <X size={14} className="text-slate-500" />
      </button>
    </div>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
