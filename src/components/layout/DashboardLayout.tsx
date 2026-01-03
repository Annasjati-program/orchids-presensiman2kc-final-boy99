import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useNotificationScheduler } from "@/hooks/useNotificationScheduler";
import { useSidebar } from "@/components/ui/sidebar";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { localAuth } from "@/lib/localAuth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { open, setOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const siswaLoggedIn = localStorage.getItem('siswa_logged_in');
    
    if (siswaLoggedIn) {
      navigate('/siswa/dashboard', { replace: true });
      return;
    }
    
    if (user && user.role === 'siswa') {
      navigate('/siswa/dashboard', { replace: true });
      return;
    }

    const session = localAuth.getSession();
    if (!session.user) {
      navigate('/', { replace: true });
      return;
    }

    if (session.user.role !== 'admin' && session.user.role !== 'guru') {
      navigate('/', { replace: true });
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useSwipeGesture({
    onSwipeRight: () => {
      if (isMobile && !open) {
        setOpen(true);
      }
    },
    onSwipeLeft: () => {
      if (isMobile && open) {
        setOpen(false);
      }
    },
    threshold: 80,
    preventScroll: false,
  });

  useNotificationScheduler();
  
  return (
    <div className="min-h-screen flex w-full relative">
      <div className="relative z-50">
        <AppSidebar />
      </div>
      <div className="flex-1 flex flex-col relative z-0">
        <TopBar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-muted/30 relative overflow-auto">
          <div className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 50%, transparent 20%, hsl(var(--muted-foreground) / 0.06) 21%, hsl(var(--muted-foreground) / 0.06) 22%, transparent 23%),
                radial-gradient(circle at 80% 50%, transparent 20%, hsl(var(--muted-foreground) / 0.06) 21%, hsl(var(--muted-foreground) / 0.06) 22%, transparent 23%),
                radial-gradient(circle at 50% 20%, transparent 15%, hsl(var(--muted-foreground) / 0.04) 16%, transparent 17%),
                radial-gradient(circle at 50% 80%, transparent 15%, hsl(var(--muted-foreground) / 0.04) 16%, transparent 17%),
                linear-gradient(135deg, transparent 48%, hsl(var(--muted-foreground) / 0.03) 49%, transparent 51%),
                linear-gradient(45deg, transparent 48%, hsl(var(--muted-foreground) / 0.03) 49%, transparent 51%),
                repeating-linear-gradient(60deg, transparent, transparent 10px, hsl(var(--muted-foreground) / 0.02) 10px, hsl(var(--muted-foreground) / 0.02) 11px),
                repeating-linear-gradient(120deg, transparent, transparent 10px, hsl(var(--muted-foreground) / 0.02) 10px, hsl(var(--muted-foreground) / 0.02) 11px)
              `,
              backgroundSize: '100px 100px, 100px 100px, 80px 80px, 80px 80px, 40px 40px, 40px 40px, 60px 60px, 60px 60px',
              backgroundPosition: '0 0, 50px 50px, 25px 25px, 75px 75px, 0 0, 20px 20px, 0 0, 30px 30px'
            }}
          />
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}