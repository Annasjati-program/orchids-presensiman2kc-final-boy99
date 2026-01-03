import { Bell, Check, CheckCheck, Trash2, X, Calendar, BookOpen, Users, Info, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationType } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const iconMap: Record<NotificationType, any> = {
  jadwal: Calendar,
  jurnal: BookOpen,
  kehadiran: Users,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const colorMap: Record<NotificationType, string> = {
  jadwal: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
  jurnal: 'text-purple-500 bg-purple-50 dark:bg-purple-950',
  kehadiran: 'text-green-500 bg-green-50 dark:bg-green-950',
  info: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950',
  warning: 'text-amber-500 bg-amber-50 dark:bg-amber-950',
  error: 'text-red-500 bg-red-50 dark:bg-red-950',
};

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (id: string, actionUrl?: string) => {
    markAsRead(id);
    if (actionUrl) {
      const url = actionUrl.startsWith('/dashboard') ? actionUrl : `/dashboard${actionUrl}`;
      navigate(url);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Notifikasi</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} baru</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 px-2 text-xs"
                title="Tandai semua dibaca"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8 px-2 text-xs"
                title="Hapus semua"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[320px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                Tidak ada notifikasi
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Notifikasi akan muncul di sini
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const Icon = iconMap[notif.type];
                const colorClass = colorMap[notif.type];

                return (
                  <div
                    key={notif.id}
                    className={cn(
                      'py-3 px-4 hover:bg-accent/50 transition-colors cursor-pointer relative group',
                      !notif.isRead && 'bg-accent/30'
                    )}
                    onClick={() =>
                      handleNotificationClick(notif.id, notif.actionUrl)
                    }
                  >
                    {!notif.isRead && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                    
                    <div className="flex gap-3 ml-2">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 self-start',
                          colorClass
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm leading-tight">
                              {notif.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1.5">
                              {formatDistanceToNow(notif.createdAt, {
                                addSuffix: true,
                                locale: id,
                              })}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            {!notif.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notif.id);
                                }}
                                className="h-7 w-7 p-0"
                                title="Tandai dibaca"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif.id);
                              }}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              title="Hapus"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}