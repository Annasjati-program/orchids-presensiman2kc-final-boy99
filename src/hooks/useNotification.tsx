import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export interface NotificationSettings {
  enabled: boolean;
  days: string[]; // ['monday', 'tuesday', etc]
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  journalReminder: boolean;
  scheduleReminder: boolean;
  reminderBeforeMinutes: number; // minutes before class
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  startTime: '07:00',
  endTime: '16:00',
  journalReminder: true,
  scheduleReminder: true,
  reminderBeforeMinutes: 15,
};

export const useNotification = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Check current permission
    const updatePermission = () => {
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    };

    updatePermission();

    // Listen for focus events to recheck permission
    window.addEventListener('focus', updatePermission);
    
    return () => {
      window.removeEventListener('focus', updatePermission);
    };
  }, []);

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        subscription: sub.toJSON(),
      });

      setSubscription(sub);
      console.log('✅ Push subscription created successfully');
      return sub;
    } catch (error) {
      console.error('❌ Failed to subscribe to push:', error);
      throw error;
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Tidak Didukung",
        description: "Browser Anda tidak mendukung notifikasi",
        variant: "destructive",
      });
      return false;
    }

    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    if (currentPermission === 'granted') {
      await subscribeToPush();
      toast({
        variant: "success",
        title: "Izin Sudah Diberikan",
        description: "Notifikasi sudah aktif dan akan muncul bahkan saat browser tertutup",
      });
      return true;
    }

    if (currentPermission === 'denied') {
      toast({
        title: "Izin Telah Ditolak",
        description: "Untuk mengaktifkan kembali, klik ikon kunci/gembok di sebelah URL lalu ubah pengaturan notifikasi menjadi 'Izinkan', kemudian muat ulang halaman.",
        variant: "destructive",
        duration: 10000,
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await subscribeToPush();
        toast({
          variant: "success",
          title: "Izin Diberikan",
          description: "Notifikasi telah diaktifkan dan akan muncul bahkan saat browser tertutup",
        });
        return true;
      } else if (result === 'denied') {
        toast({
          title: "Izin Ditolak",
          description: "Untuk mengaktifkan kembali, klik ikon kunci/gembok di sebelah URL lalu ubah pengaturan notifikasi, kemudian muat ulang halaman.",
          variant: "destructive",
          duration: 10000,
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Gagal Meminta Izin",
        description: "Terjadi kesalahan saat meminta izin notifikasi",
        variant: "destructive",
      });
      return false;
    }
  };

          const sendNotification = async (title: string, options?: NotificationOptions & { bypassFilters?: boolean }) => {
            console.log('🔔 [NOTIFICATION] Attempting to send notification:', title);
            console.log('🔔 [NOTIFICATION] Current permission:', permission);
            console.log('🔔 [NOTIFICATION] Notification.permission:', Notification.permission);
            
            if (permission !== 'granted') {
              console.warn('❌ [NOTIFICATION] Permission not granted');
              toast({
                title: "Izin Notifikasi Belum Diberikan",
                description: "Klik tombol 'Minta Izin Notifikasi' terlebih dahulu",
                variant: "destructive",
              });
              return;
            }

            const bypassFilters = options?.bypassFilters || false;

            if (!bypassFilters) {
              if (!settings.enabled) {
                console.log('⚠️ [NOTIFICATION] Notifications are disabled in settings');
                return;
              }

              // Check if current day is enabled
              const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
              const currentDay = days[new Date().getDay()];
              if (!settings.days.includes(currentDay)) {
                console.log('⚠️ [NOTIFICATION] Notifications disabled for today');
                return;
              }

              // Check if current time is within allowed range
              const now = new Date();
              const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
              if (currentTime < settings.startTime || currentTime > settings.endTime) {
                console.log('⚠️ [NOTIFICATION] Outside notification time range');
                return;
              }
            }

            const notificationOptions: NotificationOptions = {
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: options?.tag || `edushift-${Date.now()}`,
              requireInteraction: true,
              silent: false,
              ...options,
            };

            delete (notificationOptions as any).bypassFilters;

            console.log('📋 [NOTIFICATION] Options:', notificationOptions);

              // Use direct Notification API - more reliable for Windows Action Center
              try {
                console.log('📢 [NOTIFICATION] Creating notification directly...');
                const notification = new Notification(title, notificationOptions);
                
                notification.onclick = () => {
                  console.log('🖱️ [NOTIFICATION] Notification clicked');
                  window.focus();
                  notification.close();
                };

                notification.onshow = () => {
                  console.log('✅ [NOTIFICATION] Notification shown successfully!');
                };

                notification.onerror = (error) => {
                  console.error('❌ [NOTIFICATION] Notification error:', error);
                };

                console.log('✅ [NOTIFICATION] Notification created:', notification);
                console.log('🎯 [NOTIFICATION] Check Windows Action Center (bottom right corner)');
                
              } catch (error) {
                console.error('❌ [NOTIFICATION] Failed to create notification:', error);
                toast({
                  title: "Gagal Mengirim Notifikasi",
                  description: "Pastikan notifikasi browser diizinkan di Windows Settings → System → Notifications",
                  variant: "destructive",
                });
              }
          };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('notificationSettings', JSON.stringify(updated));
  };

  const scheduleJournalReminder = () => {
    if (!settings.journalReminder) return;

    sendNotification('Pengingat Jurnal Mengajar', {
      body: 'Jangan lupa mengisi jurnal mengajar hari ini!',
      tag: 'journal-reminder',
      requireInteraction: true,
      data: { url: '/jurnal/agenda-mengajar' },
    });
  };

  const scheduleClassReminder = (className: string, subject: string, time: string) => {
    if (!settings.scheduleReminder) return;

    sendNotification('Pengingat Jadwal Mengajar', {
      body: `${subject} - ${className} dimulai dalam ${settings.reminderBeforeMinutes} menit`,
      tag: 'class-reminder',
      requireInteraction: true,
      data: { url: '/dashboard' },
    });
  };

    return {
      permission,
      settings,
      subscription,
      requestPermission,
      subscribeToPush,
      sendNotification,
      updateSettings,
      scheduleJournalReminder,
      scheduleClassReminder,
    };
  };
