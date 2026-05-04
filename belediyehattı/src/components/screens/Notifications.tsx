import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, BellOff, CheckCheck, FileText, UserCheck, Info } from 'lucide-react';
import { getNotifications, markAllNotificationsRead, ApiNotification } from '../../api';

interface NotificationsProps {
  onBadgeUpdate: (count: number) => void;
}

const getNotifIcon = (type: string) => {
  switch (type) {
    case 'REPORT_STATUS_CHANGED': return <FileText className="w-5 h-5" />;
    case 'REPORT_ASSIGNED': return <UserCheck className="w-5 h-5" />;
    default: return <Info className="w-5 h-5" />;
  }
};

const getNotifColor = (type: string) => {
  switch (type) {
    case 'REPORT_STATUS_CHANGED': return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'REPORT_ASSIGNED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    default: return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

export default function Notifications({ onBadgeUpdate }: NotificationsProps) {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications(0, 50);
      setNotifications(data.content || []);
      const unread = (data.content || []).filter(n => !n.read).length;
      onBadgeUpdate(unread);
    } catch (e) {
      console.error('Bildirimler yüklenemedi', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      onBadgeUpdate(0);
    } catch (e) {
      console.error('İşaretleme hatası', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-4"
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-slate-800 tracking-tight">Bildirimler</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Tümünü Okundu Yap
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <BellOff className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">Henüz bildirim yok</p>
          <p className="text-slate-300 text-xs mt-1">Rapor durumları güncellendiğinde burada görünecek</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, idx) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-white rounded-2xl p-4 border transition-all ${
                notif.read ? 'border-slate-200' : 'border-blue-200 shadow-sm shadow-blue-100/50'
              }`}
            >
              <div className="flex gap-3">
                <div className={`p-2.5 rounded-xl border ${getNotifColor(notif.type)}`}>
                  {getNotifIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-sm ${notif.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.body}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {new Date(notif.createdAt).toLocaleDateString('tr-TR', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
