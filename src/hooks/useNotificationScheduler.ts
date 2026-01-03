import { useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { indexedDB } from '@/lib/indexedDB';
import { format, isToday, isTomorrow, differenceInMinutes } from 'date-fns';
import { id } from 'date-fns/locale';

export function useNotificationScheduler() {
  const { addNotification } = useNotifications();

  useEffect(() => {
    const checkSchedules = async () => {
      try {
        const schedules = await indexedDB.getAll('jadwal_pelajaran');
        const now = new Date();

        schedules.forEach((schedule: any) => {
          if (!schedule.hari || !schedule.jam_mulai) return;

          const today = format(now, 'EEEE', { locale: id });
          const isScheduleToday = schedule.hari.toLowerCase() === today.toLowerCase();

          if (isScheduleToday) {
            const [hours, minutes] = schedule.jam_mulai.split(':');
            const scheduleTime = new Date();
            scheduleTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const minutesUntil = differenceInMinutes(scheduleTime, now);

            if (minutesUntil > 0 && minutesUntil <= 30) {
              const notifKey = `schedule-notif-${schedule.id}-${format(now, 'yyyy-MM-dd')}`;
              const alreadySent = localStorage.getItem(notifKey);

              if (!alreadySent) {
                addNotification({
                  type: 'jadwal',
                  title: 'Jadwal Mengajar Segera Dimulai',
                  message: `${schedule.mata_pelajaran} di kelas ${schedule.kelas} akan dimulai dalam ${minutesUntil} menit (${schedule.jam_mulai})`,
                  actionUrl: '/jurnal/jurnal-guru',
                  metadata: { scheduleId: schedule.id },
                });

                localStorage.setItem(notifKey, 'sent');
              }
            }
          }
        });
      } catch (error) {
        console.error('Error checking schedules:', error);
      }
    };

    const checkJournals = async () => {
      try {
        const journals = await indexedDB.getAll('jurnal');
        const today = format(new Date(), 'yyyy-MM-dd');

        const todayJournals = journals.filter((j: any) => j.tanggal === today);

        if (todayJournals.length === 0) {
          const now = new Date();
          const hour = now.getHours();

          if (hour >= 14) {
            const notifKey = `journal-reminder-${today}`;
            const alreadySent = localStorage.getItem(notifKey);

            if (!alreadySent) {
              addNotification({
                type: 'jurnal',
                title: 'Jurnal Belum Diisi',
                message: 'Anda belum mengisi jurnal hari ini',
                actionUrl: '/jurnal/jurnal-guru',
                metadata: { date: today },
              });

              localStorage.setItem(notifKey, 'sent');
            }
          }
        }
      } catch (error) {
        console.error('Error checking journals:', error);
      }
    };

    const checkAbsences = async () => {
      try {
        const attendances = await indexedDB.getAll('kehadiran');
        const students = await indexedDB.getAll('siswa');

        const studentAbsenceMap: Record<string, number> = {};

        attendances.forEach((att: any) => {
          if (att.status === 'alpa' || att.status === 'sakit' || att.status === 'izin') {
            studentAbsenceMap[att.id_siswa] = (studentAbsenceMap[att.id_siswa] || 0) + 1;
          }
        });

        Object.entries(studentAbsenceMap).forEach(([studentId, count]) => {
          if (count >= 3) {
            const student = students.find((s: any) => s.id === studentId);
            const notifKey = `absence-alert-${studentId}-${count}`;
            const alreadySent = localStorage.getItem(notifKey);

            if (!alreadySent && student) {
              addNotification({
                type: 'kehadiran',
                title: 'Siswa Tidak Hadir Berturut-turut',
                message: `${student.nama} telah tidak hadir sebanyak ${count}x`,
                actionUrl: '/kehadiran/rekap-kehadiran',
                metadata: { studentId, absenceCount: count },
              });

              localStorage.setItem(notifKey, 'sent');
            }
          }
        });
      } catch (error) {
        console.error('Error checking absences:', error);
      }
    };

    checkSchedules();
    checkJournals();
    checkAbsences();

    const interval = setInterval(() => {
      checkSchedules();
      checkJournals();
      checkAbsences();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [addNotification]);
}