import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AcademicYearSelector } from "@/components/common/AcademicYearSelector";
import { NotificationCenter } from "@/components/common/NotificationCenter";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, Settings, Circle, Clock, Calendar as CalendarIcon, RotateCcw, AlertTriangle, Moon, Sun, ChevronLeft, ChevronRight, RefreshCw, Cloud, CloudOff, Wifi, WifiOff, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { indexedDB } from "@/lib/indexedDB";
import { opfsStorage } from "@/lib/opfsStorage";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const getWIBDate = () => {
  const now = new Date();
  const wibOffset = 7 * 60;
  const utcOffset = now.getTimezoneOffset();
  const totalOffset = wibOffset + utcOffset;
  return new Date(now.getTime() + totalOffset * 60 * 1000);
};

export function TopBar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { syncStatus: supabaseSyncStatus, syncAllTables } = useSupabaseSync();
  
  const syncStatus = supabaseSyncStatus.isSyncing 
    ? 'syncing' 
    : (supabaseSyncStatus.isOnline ? 'online' : 'offline');
  
  const [currentTime, setCurrentTime] = useState(getWIBDate());
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const saved = localStorage.getItem('selectedDate');
    if (saved) {
      const savedDate = new Date(saved);
      const today = getWIBDate();
      const isSameDay = 
        savedDate.getFullYear() === today.getFullYear() &&
        savedDate.getMonth() === today.getMonth() &&
        savedDate.getDate() === today.getDate();
      
      if (!isSameDay && savedDate < today) {
        localStorage.removeItem('selectedDate');
        return today;
      }
      return savedDate;
    }
    return getWIBDate();
  });
  const [showBackupWarning, setShowBackupWarning] = useState(false);
  const [daysSinceBackup, setDaysSinceBackup] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [avatarBlobUrl, setAvatarBlobUrl] = useState<string | null>(null);
  const avatarBlobUrlRef = useRef<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  // Track navigation history
  useEffect(() => {
    const checkNavigationState = () => {
      setCanGoBack(window.history.length > 1);
      // We can't reliably check forward history, so we'll track it manually
    };
    
    checkNavigationState();
    
    // Listen for navigation events
    window.addEventListener('popstate', checkNavigationState);
    
    return () => {
      window.removeEventListener('popstate', checkNavigationState);
    };
  }, []);

  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
    }
  };

  const handleForward = () => {
    navigate(1);
  };

  // Update time only (not date) every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getWIBDate());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        variant: "success",
        title: "Koneksi Tersambung",
        description: "Anda kembali online",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        variant: "destructive",
        title: "Koneksi Terputus",
        description: "Anda sedang offline. Beberapa fitur mungkin tidak tersedia.",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Load profile from localStorage
  useEffect(() => {
    const loadProfile = async () => {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          
          // IMPORTANT: Clean up invalid blob:// URLs from localStorage
          if (parsed.avatar_url && parsed.avatar_url.startsWith('blob:')) {
            parsed.avatar_url = '';
            localStorage.setItem('userProfile', JSON.stringify(parsed));
            setUserProfile(parsed);
            return;
          }
          
          // Selalu load avatar dari OPFS jika menggunakan opfs://
          if (parsed.avatar_url && parsed.avatar_url.startsWith('opfs://')) {
            const file = await opfsStorage.getFile(parsed.avatar_url);
            if (file && file instanceof Blob) {
              // Revoke old blob URL before creating new one
              if (avatarBlobUrlRef.current) {
                URL.revokeObjectURL(avatarBlobUrlRef.current);
                avatarBlobUrlRef.current = null;
              }
              // Create new blob URL
              const newBlobUrl = URL.createObjectURL(file);
              avatarBlobUrlRef.current = newBlobUrl;
              setAvatarBlobUrl(newBlobUrl);
              setUserProfile(parsed);
            } else if (typeof file === 'string') {
              // base64 fallback
              setAvatarBlobUrl(null);
              setUserProfile({ ...parsed, avatar_url: file });
            } else {
              console.error('TopBar failed to load avatar from OPFS');
              setAvatarBlobUrl(null);
              setUserProfile({ ...parsed, avatar_url: '' });
            }
            return;
          }
          
          // Non-OPFS - no blob URL needed
          setAvatarBlobUrl(null);
          setUserProfile(parsed);
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };

    loadProfile();

    // Listen for profile updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userProfile') {
        loadProfile();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-window updates
    const handleProfileUpdate = () => {
      loadProfile();
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      // Cleanup blob URL on unmount
      if (avatarBlobUrlRef.current) {
        URL.revokeObjectURL(avatarBlobUrlRef.current);
        avatarBlobUrlRef.current = null;
      }
    };
  }, []);

  // Check last backup date
  useEffect(() => {
    const checkBackupDate = () => {
      const lastBackupDate = localStorage.getItem('lastBackupDate');
      
      if (!lastBackupDate) {
        // No backup yet, show warning
        setShowBackupWarning(true);
        setDaysSinceBackup(0);
        return;
      }

      const lastBackup = new Date(lastBackupDate);
      const today = getWIBDate();
      const daysDiff = differenceInDays(today, lastBackup);
      
      setDaysSinceBackup(daysDiff);
      
      // Show warning if more than 14 days (2 weeks)
      if (daysDiff >= 14) {
        setShowBackupWarning(true);
      } else {
        setShowBackupWarning(false);
      }
    };

    checkBackupDate();
    
    // Check daily
    const interval = setInterval(checkBackupDate, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Save and broadcast date changes
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    localStorage.setItem('selectedDate', date.toISOString());
    // Broadcast to other components
    window.dispatchEvent(new CustomEvent('dateChanged', { detail: date }));
  };

  const handleResetToToday = () => {
    const today = getWIBDate();
    handleDateChange(today);
  };

  const handleRefreshDatabase = async () => {
    try {
      await indexedDB.initializeDefaultData();
      toast({
        variant: "success",
        title: "Database di-refresh",
        description: "Database berhasil di-refresh dengan data default.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat refresh database",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      {showBackupWarning && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-800 dark:text-amber-200">
              {daysSinceBackup === 0 
                ? "Anda belum pernah melakukan backup data." 
                : `Sudah ${daysSinceBackup} hari sejak backup terakhir.`} 
              {" "}Segera lakukan backup untuk mengamankan data Anda.
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/dashboard/data/backup-restore')}
              className="ml-4 border-amber-600 text-amber-700 hover:bg-amber-100 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-950"
            >
              Backup Sekarang
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <header className="h-14 sm:h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-full items-center justify-between px-2 sm:px-4 gap-2">
          {/* Left Section */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <SidebarTrigger className="h-11 w-11 flex-shrink-0" />
            
            {/* Navigation Back/Forward Buttons - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={!canGoBack}
                className="h-10 w-10 p-0"
                title="Halaman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleForward}
                className="h-10 w-10 p-0"
                title="Halaman berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Status & Time - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4 min-w-0">
              <div className="flex items-center gap-2">
                <Circle 
                  className={`h-2.5 w-2.5 flex-shrink-0 animate-pulse ${
                    isOnline 
                      ? 'fill-emerald-500 text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]' 
                      : 'fill-red-500 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                  }`} 
                />
                <Badge 
                  variant="secondary" 
                  className={`flex-shrink-0 font-medium ${
                    isOnline
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-700'
                      : 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-700'
                  }`}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
                
                {/* Sync Status & Button */}
                {syncStatus === 'syncing' ? (
                  <Badge variant="outline" className="flex items-center gap-1.5 flex-shrink-0">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Sinkronisasi...</span>
                  </Badge>
                ) : syncStatus === 'online' ? (
                  <Badge variant="outline" className="flex items-center gap-1.5 flex-shrink-0 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                    <Cloud className="h-3 w-3 text-green-600 dark:text-green-500" />
                    <span className="text-green-700 dark:text-green-400">Tersinkron</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1.5 flex-shrink-0 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
                    <CloudOff className="h-3 w-3 text-orange-600 dark:text-orange-500" />
                    <span className="text-orange-700 dark:text-orange-400">Offline</span>
                  </Badge>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => syncAllTables()}
                  disabled={syncStatus === 'syncing'}
                  className="h-10 w-10 p-0 flex-shrink-0"
                  title="Sinkronisasi Manual"
                >
                  <RefreshCw className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {/* Date & Time - Hidden on tablets */}
              <div className="hidden lg:flex items-center gap-4 text-sm text-muted-foreground">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 h-10 px-3">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="truncate">{format(selectedDate, "EEEE, dd MMMM yyyy", { locale: id })}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 border-b flex items-center justify-between">
                      <span className="text-sm font-medium">Pilih Tanggal</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleResetToToday}
                        className="h-8 text-xs"
                      >
                        Hari Ini
                      </Button>
                    </div>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && handleDateChange(date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{format(currentTime, "HH:mm:ss")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
            {/* Academic Year Selector - Always visible but might be compact */}
            <div className="hidden md:block">
              <AcademicYearSelector />
            </div>
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-11 w-11 p-0 flex-shrink-0"
              title="Toggle tema"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            {/* Notification Center */}
            <NotificationCenter />
            
            {/* Refresh Database - Hidden on mobile and tablet */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshDatabase}
              className="h-11 w-11 p-0 hidden lg:flex flex-shrink-0"
              title="Refresh Database"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            
            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-11 w-11 rounded-full p-0 flex-shrink-0">
                  <Avatar className="h-11 w-11 border-2 border-primary">
                    <AvatarImage 
                      src={userProfile?.avatar_url?.startsWith('opfs://') ? avatarBlobUrl || '' : userProfile?.avatar_url}
                      onError={(e) => e.currentTarget.src = ''}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userProfile?.nama ? userProfile.nama.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'AD'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border-border z-50">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-10 w-10 border-2 border-primary">
                    <AvatarImage 
                      src={userProfile?.avatar_url?.startsWith('opfs://') ? avatarBlobUrl || '' : userProfile?.avatar_url}
                      onError={(e) => e.currentTarget.src = ''}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userProfile?.nama ? userProfile.nama.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'AD'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{userProfile?.nama || 'Administrator'}</span>
                    <span className="text-xs text-muted-foreground">{userProfile?.email || 'admin@sekolah.com'}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                
                {/* Show Academic Year in dropdown on mobile */}
                <div className="md:hidden px-2 py-1.5">
                  <AcademicYearSelector />
                </div>
                <DropdownMenuSeparator className="md:hidden" />
                
                <DropdownMenuItem onClick={() => navigate('/dashboard/akun/profil')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
                
                {/* Show Refresh Database in dropdown on mobile and tablet */}
                <DropdownMenuSeparator className="lg:hidden" />
                <DropdownMenuItem onClick={handleRefreshDatabase} className="lg:hidden">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  <span>Refresh Database</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}