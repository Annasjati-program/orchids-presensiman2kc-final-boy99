import {
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  TrendingUp,
  FileInput,
  BarChart3,
  Calendar,
  CalendarCheck,
  FileText,
  Database,
  Download,
  User,
  HelpCircle,
  Settings,
  ClipboardList,
  UserCog,
  CalendarDays,
  LayoutDashboard,
  Bell,
  Cloud,
  HardDrive,
  FileBarChart,
  BookText,
  CalendarClock,
  ChevronDown,
  Star,
  Sparkles,
  Tags,
  QrCode,
  Trash2,
  Trophy,
  UserPlus,
  ClipboardCheck,
  ChevronsDown,
  ChevronsUp,
  Shuffle,
  Wifi,
  WifiOff,
  CloudOff,
  RefreshCw,
  Eye
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { opfsStorage } from "@/lib/opfsStorage";
import { useOfflineOnlineSync, SyncableItem } from "@/hooks/useOfflineOnlineSync";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { localDB } from "@/lib/localDB";
import { supabase } from "@/lib/supabase";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QuickMenuManager } from "./QuickMenuManager";
import { useState, useEffect } from "react";

const menuItems = [
  {
    title: "PENGATURAN",
    icon: Settings,
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Kalender", url: "/dashboard/kalender", icon: CalendarDays },
      { title: "Daftar Guru", url: "/dashboard/pengaturan/guru", icon: UserCheck },
      { title: "Daftar Kelas", url: "/dashboard/pengaturan/kelas", icon: GraduationCap },
      { title: "Daftar Siswa", url: "/dashboard/pengaturan/siswa", icon: Users },
      { title: "Mata Pelajaran", url: "/dashboard/pengaturan/mata-pelajaran", icon: BookOpen },
      { title: "Jadwal Pelajaran", url: "/dashboard/pengaturan/jadwal-pelajaran", icon: CalendarDays },
      { title: "Bobot Penilaian", url: "/dashboard/pengaturan/bobot-penilaian", icon: TrendingUp },
      { title: "Tahun Ajaran", url: "/dashboard/pengaturan/tahun-ajaran", icon: CalendarClock },
      { title: "Pembuat Kelompok", url: "/dashboard/pengaturan/pembuat-kelompok", icon: Shuffle },
      { title: "Format PDF", url: "/dashboard/pengaturan/format-pdf", icon: FileText },
      { title: "Notifikasi", url: "/dashboard/pengaturan/notifikasi", icon: Bell },
    ],
  },
  {
    title: "PENILAIAN",
    icon: ClipboardList,
    items: [
      { title: "Input Nilai", url: "/dashboard/penilaian/input-nilai", icon: FileInput },
      { title: "Rekap Nilai", url: "/dashboard/penilaian/rekap-nilai", icon: BarChart3 },
    ],
  },
  {
    title: "KEHADIRAN",
    icon: Calendar,
    items: [
      { title: "Input Kehadiran", url: "/dashboard/kehadiran/input-kehadiran", icon: CalendarCheck },
      { title: "Rekap Kehadiran", url: "/dashboard/kehadiran/rekap-kehadiran", icon: Calendar },
    ],
  },
  {
    title: "JURNAL",
    icon: FileText,
    items: [
      { title: "Jurnal Guru", url: "/dashboard/jurnal/jurnal-guru", icon: FileText },
      { title: "Agenda Mengajar", url: "/dashboard/jurnal/agenda-mengajar", icon: ClipboardList },
    ],
  },
  {
    title: "EKSTRAKURIKULER",
    icon: Trophy,
    items: [
      { title: "Kelola Ekstrakurikuler", url: "/dashboard/ekstrakurikuler/kelola", icon: Trophy },
      { title: "Kelola Anggota", url: "/dashboard/ekstrakurikuler/anggota", icon: UserPlus },
      { title: "Kehadiran Eskul", url: "/dashboard/ekstrakurikuler/kehadiran", icon: ClipboardCheck },
      { title: "Generate Token", url: "/dashboard/ekstrakurikuler/generate-token", icon: QrCode },
      { title: "Preview Login Siswa", url: "/login-siswa", icon: Eye },
      { title: "Input Nilai Eskul", url: "/dashboard/ekstrakurikuler/input-nilai", icon: FileInput },
      { title: "Rekap Kehadiran Eskul", url: "/dashboard/ekstrakurikuler/rekap-kehadiran", icon: FileBarChart },
    ],
  },
  {
    title: "LAPORAN",
    icon: FileBarChart,
    items: [
      { title: "Laporan Kehadiran", url: "/dashboard/laporan/kehadiran", icon: FileText },
      { title: "Laporan Penilaian", url: "/dashboard/laporan/penilaian", icon: BarChart3 },
      { title: "Laporan Jurnal Guru", url: "/dashboard/laporan/jurnal-guru", icon: BookText },
    ],
  },
  {
    title: "DATA",
    icon: Database,
    items: [
      { title: "Manajemen Data", url: "/dashboard/data/manajemen-data", icon: Database },
      { title: "Backup dan Restore", url: "/dashboard/data/backup-restore", icon: Download },
      { title: "Backup Google Drive", url: "/dashboard/data/backup-google-drive", icon: Cloud },
      { title: "Storage Monitor", url: "/dashboard/data/storage-monitor", icon: HardDrive },
      { title: "Cleanup Storage", url: "/dashboard/data/cleanup-storage", icon: Trash2 },
    ],
  },
  {
    title: "AKUN",
    icon: UserCog,
    items: [
      { title: "Profil", url: "/dashboard/akun/profil", icon: User },
      { title: "Bantuan", url: "/dashboard/akun/bantuan", icon: HelpCircle },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { open } = useSidebar();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  
  const { items, updateItems, isOnline: quickMenuOnline, isSyncing: quickMenuSyncing } = useOfflineOnlineSync();
  const { syncStatus, syncAllTables } = useSupabaseSync();

  // Icon mapping for localStorage restoration
  const iconMap: Record<string, any> = {
    LayoutDashboard, CalendarDays, UserCheck, GraduationCap, Users, BookOpen,
    TrendingUp, CalendarClock, FileText, Bell, FileInput, BarChart3, CalendarCheck,
    Calendar, ClipboardList, FileBarChart, BookText, Database, Download, Cloud,
    HardDrive, User, HelpCircle, Tags, Trophy, UserPlus, ClipboardCheck, Shuffle
  };
  
  // Get all available menu items for quick menu
  const getAllMenuItems = () => {
    const allItems: any[] = [];
    menuItems.forEach((group) => {
      allItems.push(...group.items);
    });
    return allItems;
  };
  
  // Convert synced items to quick menu format
  const quickMenuItems = items.map((item) => ({
    title: item.title,
    url: item.path,
    icon: iconMap[item.icon] || LayoutDashboard
  }));
  
  // Get icon name from component
  const getIconName = (IconComponent: any): string => {
    for (const [name, component] of Object.entries(iconMap)) {
      if (component === IconComponent) {
        return name;
      }
    }
    return 'LayoutDashboard';
  };
  
  // Update quick menu - now syncs to both offline and online
  const updateQuickMenu = async (items: any[]) => {
    const syncableItems: SyncableItem[] = items.map(item => ({
      title: item.title,
      icon: getIconName(item.icon),
      path: item.url,
      color: 'primary'
    }));
    
    await updateItems(syncableItems);
  };
  
  // Track which groups are open - initialize with group containing active route
  const getInitialOpenGroups = () => {
    const openGroups: string[] = [];
    menuItems.forEach((group) => {
      if (group.items.some((item) => location.pathname === item.url)) {
        openGroups.push(group.title);
      }
    });
    return openGroups;
  };
  
  const [openGroups, setOpenGroups] = useState<string[]>(getInitialOpenGroups);
  
  const toggleGroup = (title: string) => {
    setOpenGroups((prev) =>
      prev.includes(title)
        ? prev.filter((g) => g !== title)
        : [...prev, title]
    );
  };

  const collapseAll = () => {
    setOpenGroups([]);
  };

  const expandAll = () => {
    setOpenGroups(menuItems.map(g => g.title));
  };
  
  // Auto-open group when route changes - but only if not in quick menu
  useEffect(() => {
    // Check if current path is in quick menu
    const isInQuickMenu = quickMenuItems.some((item) => item.url === location.pathname);
    
    // Only auto-open if the current route is NOT in quick menu
    if (!isInQuickMenu) {
      menuItems.forEach((group) => {
        if (group.items.some((item) => location.pathname === item.url)) {
          if (!openGroups.includes(group.title)) {
            setOpenGroups((prev) => [...prev, group.title]);
          }
        }
      });
    }
  }, [location.pathname, quickMenuItems]);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        if (navigator.onLine) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .limit(1)
            .single();

          if (data) {
            const profileData = {
              nama: data.nama || 'User',
              email: data.email || '',
              avatar_url: data.avatar_url || ''
            };
            setUserProfile(profileData);
            localStorage.setItem('userProfile', JSON.stringify(profileData));
            return;
          }
        }
      } catch (error) {
        console.error('Error loading profile from Supabase:', error);
      }

      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setUserProfile({
            nama: parsed.nama || 'User',
            email: parsed.email || '',
            avatar_url: parsed.avatar_url || ''
          });
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };

    loadUserProfile();

    const handleProfileUpdate = () => {
      loadUserProfile();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const getNavCls = (isActive: boolean) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar className={open ? "w-64" : "w-14"} collapsible="icon">
      {/* Batik Pattern Background */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 45%, transparent 18%, hsl(var(--sidebar-foreground) / 0.08) 19%, hsl(var(--sidebar-foreground) / 0.08) 21%, transparent 22%),
            radial-gradient(circle at 85% 55%, transparent 18%, hsl(var(--sidebar-foreground) / 0.08) 19%, hsl(var(--sidebar-foreground) / 0.08) 21%, transparent 22%),
            radial-gradient(circle at 50% 15%, transparent 12%, hsl(var(--sidebar-foreground) / 0.05) 13%, transparent 14%),
            radial-gradient(circle at 50% 85%, transparent 12%, hsl(var(--sidebar-foreground) / 0.05) 13%, transparent 14%),
            linear-gradient(120deg, transparent 47%, hsl(var(--sidebar-foreground) / 0.04) 48%, transparent 50%),
            linear-gradient(60deg, transparent 47%, hsl(var(--sidebar-foreground) / 0.04) 48%, transparent 50%),
            repeating-linear-gradient(45deg, transparent, transparent 8px, hsl(var(--sidebar-foreground) / 0.03) 8px, hsl(var(--sidebar-foreground) / 0.03) 9px),
            repeating-linear-gradient(135deg, transparent, transparent 8px, hsl(var(--sidebar-foreground) / 0.03) 8px, hsl(var(--sidebar-foreground) / 0.03) 9px)
          `,
          backgroundSize: '90px 90px, 90px 90px, 70px 70px, 70px 70px, 35px 35px, 35px 35px, 50px 50px, 50px 50px',
          backgroundPosition: '0 0, 45px 45px, 20px 20px, 65px 65px, 0 0, 15px 15px, 0 0, 25px 25px'
        }}
      />
      
      <SidebarHeader className="border-b border-sidebar-border p-4 relative z-10">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/dashboard/')}
        >
          <div className="p-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex flex-col group-data-[state=collapsed]:lg:hidden">
            <h1 className="font-bold text-lg text-sidebar-foreground">SIAKAD</h1>
            <p className="text-xs text-sidebar-foreground/70">Sistem Administrasi Sekolah</p>
          </div>
        </div>

        {/* Profile Section - Fixed, tidak ikut scroll */}
        {userProfile && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center gap-2">
              <div 
                className="flex-1 flex items-center gap-2 p-1 rounded-lg hover:bg-sidebar-accent/50 cursor-pointer transition-colors"
                onClick={() => navigate('/dashboard/akun/profil')}
              >
                <Avatar className="h-12 w-12 border-2 border-sidebar-border">
                  <AvatarImage 
                    src={userProfile.avatar_url || undefined} 
                    alt={userProfile.nama || 'User'} 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {userProfile.nama?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 group-data-[state=collapsed]:lg:hidden">
                  <p className="text-sm font-medium text-sidebar-foreground break-words">
                    {userProfile.nama || 'User'}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 break-words">
                    {userProfile.email || 'user'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 group-data-[state=collapsed]:lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11"
                  onClick={collapseAll}
                  title="Tutup Semua Menu"
                >
                  <ChevronsUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11"
                  onClick={expandAll}
                  title="Buka Semua Menu"
                >
                  <ChevronsDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-0 relative z-10">
        {/* Quick Menu Section */}
        {quickMenuItems.length > 0 && (
          <>
            <SidebarGroup className="py-0">
              <div className="flex items-center justify-between px-2 py-1 mb-0.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground group-data-[state=collapsed]:lg:hidden">
                    QUICK MENU
                  </span>
                </div>
                <div className="flex items-center gap-1 group-data-[state=collapsed]:lg:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuickMenuOpen(true)}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  {quickMenuItems.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className="h-9">
                          <NavLink 
                            to={item.url} 
                            className={getNavCls(isActive(item.url))}
                          >
                            <ItemIcon className="h-4 w-4" />
                            <span className="text-sm font-medium group-data-[state=collapsed]:lg:hidden">{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <Separator className="my-1.5" />
          </>
        )}

        {/* Empty State for Quick Menu */}
        {quickMenuItems.length === 0 && (
          <>
            <SidebarGroup className="py-0">
              <div className="px-2 py-3 text-center group-data-[state=collapsed]:lg:hidden">
                <div className="space-y-2">
                  <Sparkles className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    Belum ada Quick Menu
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setQuickMenuOpen(true)}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Atur Quick Menu
                  </Button>
                </div>
              </div>
            </SidebarGroup>
            <Separator className="my-1.5" />
          </>
        )}

        {/* Grouped Menu Items */}
        {menuItems.map((group) => {
          const GroupIcon = group.icon;
          const isGroupOpen = openGroups.includes(group.title);
          
          return (
            <Collapsible
              key={group.title}
              open={isGroupOpen}
              onOpenChange={() => toggleGroup(group.title)}
            >
              <SidebarGroup className="py-0">
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="px-3 py-2 cursor-pointer hover:bg-sidebar-accent/70 rounded-md transition-colors group mb-0 bg-sidebar-accent/30 min-h-[40px]">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <GroupIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-sidebar-foreground group-data-[state=collapsed]:lg:hidden">
                          {group.title}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-sidebar-foreground/60 transition-transform duration-200 group-data-[state=collapsed]:lg:hidden ${
                          isGroupOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <SidebarGroupContent className="ml-6 mt-0.5 mb-1">
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild className="h-9">
                              <NavLink 
                                to={item.url} 
                                className={getNavCls(isActive(item.url))}
                              >
                                <ItemIcon className="h-3.5 w-3.5 opacity-70" />
                                <span className="text-sm font-normal group-data-[state=collapsed]:lg:hidden">{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
        
        {/* Quick Menu Manager Dialog */}
        <QuickMenuManager
          open={quickMenuOpen}
          onOpenChange={setQuickMenuOpen}
          quickMenuItems={quickMenuItems}
          onUpdate={updateQuickMenu}
          allMenuItems={getAllMenuItems()}
        />
      </SidebarContent>
    </Sidebar>
  );
}