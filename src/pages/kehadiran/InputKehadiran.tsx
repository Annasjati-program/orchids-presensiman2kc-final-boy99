import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { indexedDB } from "@/lib/indexedDB";
import { getActiveTahunAjaran } from "@/lib/academicYearUtils";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Save, Calendar, CheckCheck, X, Clock, UserX, BookOpen, Star, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: string;
  jurusan: string;
  tahun_ajaran: string;
}

interface MataPelajaran {
  id: string;
  nama_mata_pelajaran: string;
  kode_mata_pelajaran: string;
  status: string;
}

interface Siswa {
  id: string;
  nisn: string;
  nama_siswa: string;
  kelas_id: string;
  status: string;
}

interface Kehadiran {
  id?: string;
  siswa_id: string;
  kelas_id: string;
  mata_pelajaran_id?: string;
  tanggal: string;
  status_kehadiran: string;
  keaktifan?: string;
  keterangan?: string;
}

interface JadwalPelajaran {
  id: string;
  kelas_id: string;
  mata_pelajaran_id: string;
  hari: string;
  jam_ke: number;
  jumlah_jp: number;
  status: string;
}

interface ScheduleQuickButton {
  jadwal_id: string;
  kelas_id: string;
  kelas_nama: string;
  kelas_tingkat: string;
  mata_pelajaran_id: string;
  mata_pelajaran_nama: string;
  jam_ke: number;
  jumlah_jp: number;
}

const InputKehadiran = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Load saved state from localStorage
  const getSavedState = (key: string, defaultValue: string) => {
    try {
      const saved = localStorage.getItem(`input_kehadiran_${key}`);
      return saved || defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [selectedTingkat, setSelectedTingkat] = useState(() => getSavedState('tingkat', ""));
  const [selectedKelas, setSelectedKelas] = useState(() => getSavedState('kelas', ""));
  const [selectedMataPelajaran, setSelectedMataPelajaran] = useState(() => getSavedState('mata_pelajaran', ""));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [allKelas, setAllKelas] = useState<Kelas[]>([]);
  const [filteredKelas, setFilteredKelas] = useState<Kelas[]>([]);
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaran[]>([]);
  const [students, setStudents] = useState<Siswa[]>([]);
  const [attendance, setAttendance] = useState<{[key: string]: string}>({});
  const [keaktifan, setKeaktifan] = useState<{[key: string]: string}>({});
  const [existingAttendance, setExistingAttendance] = useState<{[key: string]: Kehadiran}>({});
    const [loading, setLoading] = useState(false);
    const [todaySchedules, setTodaySchedules] = useState<ScheduleQuickButton[]>([]);
    const [activeTahunAjaran, setActiveTahunAjaran] = useState("");
    const [scheduleLoadedForDate, setScheduleLoadedForDate] = useState<string>("");

    const tingkatOptions = ["X", "XI", "XII"];

  // Save state to localStorage
  const saveState = (key: string, value: string) => {
    try {
      localStorage.setItem(`input_kehadiran_${key}`, value);
    } catch (error) {
      console.warn('Failed to save state:', error);
    }
  };

  // Handle data from dashboard navigation
  useEffect(() => {
    const state = location.state as any;
    if (state?.fromSchedule && state?.scheduleData) {
      const { kelas_id, mata_pelajaran_id } = state.scheduleData;
      
      // Find kelas to get tingkat
      indexedDB.select("kelas", k => k.id === kelas_id).then(kelasData => {
        if (kelasData.length > 0) {
          const tingkat = kelasData[0].tingkat;
          setSelectedTingkat(tingkat);
          setSelectedKelas(kelas_id);
          setSelectedMataPelajaran(mata_pelajaran_id);
          saveState('tingkat', tingkat);
          saveState('kelas', kelas_id);
          saveState('mata_pelajaran', mata_pelajaran_id);
          
          toast({
            title: "Filter Otomatis",
            description: "Kelas dan mata pelajaran telah dipilih sesuai jadwal",
          });
        }
      });
      
      // Clear navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Fetch all kelas and mata pelajaran
  useEffect(() => {
    const initData = async () => {
      const year = await getActiveTahunAjaran();
      setActiveTahunAjaran(year);
      
      // Clean up IPA class on mount if it exists
      try {
        const ipaClass = await indexedDB.select("kelas", kelas => 
          kelas.id === "7399ed54-79fc-4ebc-8a48-3fc19cc1ad81"
        );
        if (ipaClass.length > 0) {
          await indexedDB.delete("kelas", "7399ed54-79fc-4ebc-8a48-3fc19cc1ad81");
          console.log("IPA class deleted successfully");
        }
      } catch (error) {
        console.error("Error deleting IPA class:", error);
      }
      
      fetchKelas();
      fetchMataPelajaran();
    };
    
    initData();
  }, []);

    // Fetch today's schedule only once per date
    useEffect(() => {
      if (scheduleLoadedForDate !== selectedDate && allKelas.length > 0 && mataPelajaran.length > 0) {
        fetchTodaySchedule();
      }
    }, [selectedDate, allKelas, mataPelajaran]);

  // Initialize filtered kelas when allKelas is loaded and we have saved tingkat
  useEffect(() => {
    if (allKelas.length > 0 && selectedTingkat) {
      const filtered = allKelas.filter(kelas => kelas.tingkat === selectedTingkat);
      setFilteredKelas(filtered);
    } else if (allKelas.length > 0) {
      setFilteredKelas([]);
    }
  }, [allKelas, selectedTingkat]);

  // Filter kelas by tingkat (but don't clear students if we have saved state)
  useEffect(() => {
    if (selectedTingkat && allKelas.length > 0) {
      const filtered = allKelas.filter(kelas => kelas.tingkat === selectedTingkat);
      setFilteredKelas(filtered);
      
      // Only clear selections if no saved state exists
      const savedKelas = getSavedState('kelas', '');
      if (!savedKelas) {
        setSelectedKelas("");
        setStudents([]);
        setAttendance({});
      }
    } else {
      setFilteredKelas([]);
      if (!getSavedState('kelas', '')) {
        setSelectedKelas("");
        setStudents([]);
        setAttendance({});
      }
    }
  }, [selectedTingkat, allKelas]);

  // Fetch students when kelas and mata pelajaran are selected
  useEffect(() => {
    if (selectedKelas && selectedMataPelajaran) {
      fetchStudentsAndAttendance();
    } else if (!selectedKelas || !selectedMataPelajaran) {
      setStudents([]);
      setAttendance({});
      setExistingAttendance({});
    }
  }, [selectedKelas, selectedMataPelajaran, selectedDate]);

  const fetchKelas = async () => {
    try {
      const year = activeTahunAjaran || await getActiveTahunAjaran();
      const data = await indexedDB.select("kelas", kelas => 
        kelas.status === "Aktif" && kelas.tahun_ajaran === year
      );
      console.log("Fetched kelas data:", data);
      const sortedData = data.sort((a, b) => {
        if (a.tingkat !== b.tingkat) {
          return a.tingkat.localeCompare(b.tingkat);
        }
        return a.nama_kelas.localeCompare(b.nama_kelas);
      });

      setAllKelas(sortedData);
    } catch (error) {
      console.error("Error fetching kelas:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data kelas",
        variant: "destructive",
      });
    }
  };

  const fetchMataPelajaran = async () => {
    try {
      const data = await indexedDB.select("mata_pelajaran", mp => mp.status === "Aktif");
      const sortedData = data.sort((a, b) => a.nama_mata_pelajaran.localeCompare(b.nama_mata_pelajaran));

      setMataPelajaran(sortedData);
    } catch (error) {
      console.error("Error fetching mata pelajaran:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data mata pelajaran",
        variant: "destructive",
      });
    }
  };

    const fetchTodaySchedule = async () => {
      if (allKelas.length === 0 || mataPelajaran.length === 0) return;

      try {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = days[new Date(selectedDate).getDay()];
        
        const allJadwal = await indexedDB.select("jadwal_pelajaran");
        
        const jadwalData = allJadwal.filter(jadwal => 
          jadwal.hari === today && jadwal.status === "Aktif"
        );

        const scheduleButtons: ScheduleQuickButton[] = jadwalData.map(jadwal => {
          const kelas = allKelas.find(k => k.id === jadwal.kelas_id);
          const mapel = mataPelajaran.find(m => m.id === jadwal.mata_pelajaran_id);
          
          return {
            jadwal_id: jadwal.id,
            kelas_id: jadwal.kelas_id,
            kelas_nama: kelas?.nama_kelas || '',
            kelas_tingkat: kelas?.tingkat || '',
            mata_pelajaran_id: jadwal.mata_pelajaran_id,
            mata_pelajaran_nama: mapel?.nama_mata_pelajaran || '',
            jam_ke: jadwal.jam_ke,
            jumlah_jp: jadwal.jumlah_jp,
          };
        }).filter(s => s.kelas_nama && s.mata_pelajaran_nama)
          .sort((a, b) => a.jam_ke - b.jam_ke);

        setTodaySchedules(scheduleButtons);
        setScheduleLoadedForDate(selectedDate);
      } catch (error) {
        console.error("Error fetching today's schedule:", error);
      }
    };

  const handleQuickSelect = (schedule: ScheduleQuickButton) => {
    setSelectedTingkat(schedule.kelas_tingkat);
    setSelectedKelas(schedule.kelas_id);
    setSelectedMataPelajaran(schedule.mata_pelajaran_id);
    saveState('tingkat', schedule.kelas_tingkat);
    saveState('kelas', schedule.kelas_id);
    saveState('mata_pelajaran', schedule.mata_pelajaran_id);
  };

  const fetchStudentsAndAttendance = async () => {
    try {
      setLoading(true);
      
      // First fetch existing attendance
      const attendanceData = await indexedDB.select("kehadiran", record => 
        record.kelas_id === selectedKelas &&
        record.mata_pelajaran_id === selectedMataPelajaran &&
        record.tanggal === selectedDate
      );
      
      const attendanceMap: {[key: string]: Kehadiran} = {};
      attendanceData.forEach(record => {
        attendanceMap[record.siswa_id] = record;
      });
      setExistingAttendance(attendanceMap);

      // Then fetch students
      const studentsData = await indexedDB.select("siswa", student => 
        student.kelas_id === selectedKelas &&
        student.status === "Aktif"
      );
      const sortedStudents = studentsData.sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

      setStudents(sortedStudents);
      
      // Initialize attendance and keaktifan with existing data
      const initialAttendance: {[key: string]: string} = {};
      const initialKeaktifan: {[key: string]: string} = {};
      studentsData.forEach(student => {
        initialAttendance[student.id] = attendanceMap[student.id]?.status_kehadiran || "";
        initialKeaktifan[student.id] = attendanceMap[student.id]?.keaktifan || "";
      });
      setAttendance(initialAttendance);
      setKeaktifan(initialKeaktifan);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa dan kehadiran",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleKeaktifanChange = (studentId: string, status: string) => {
    setKeaktifan(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleBulkAttendance = (status: string) => {
    const bulkAttendance: {[key: string]: string} = {};
    students.forEach(student => {
      bulkAttendance[student.id] = status;
    });
    setAttendance(bulkAttendance);
  };

  const handleGoToAgenda = () => {
    // Save filters to localStorage for Agenda Mengajar to read
    localStorage.setItem('agenda_mengajar_from_kehadiran', JSON.stringify({
      tingkat: selectedTingkat,
      kelas_id: selectedKelas,
      mata_pelajaran_id: selectedMataPelajaran,
      tanggal: selectedDate
    }));
    
    navigate('/dashboard/jurnal/agenda-mengajar');
  };

  const handleSave = async () => {
    if (!selectedKelas) {
      toast({
        title: "Pilih Kelas",
        description: "Silakan pilih kelas terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMataPelajaran) {
      toast({
        title: "Pilih Mata Pelajaran",
        description: "Silakan pilih mata pelajaran terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const attendanceRecords = students
        .filter(student => attendance[student.id])
        .map(student => {
          const existing = existingAttendance[student.id];
          return {
            id: existing?.id,
            siswa_id: student.id,
            kelas_id: selectedKelas,
            mata_pelajaran_id: selectedMataPelajaran,
            tanggal: selectedDate,
            status_kehadiran: attendance[student.id],
            keaktifan: keaktifan[student.id] || null,
            keterangan: existing?.keterangan || null,
          };
        });

      // Separate insert and update operations
      const toInsert = attendanceRecords.filter(record => !record.id);
      const toUpdate = attendanceRecords.filter(record => record.id);

      // Insert new records
      for (const record of toInsert) {
        const result = await indexedDB.insert("kehadiran", {
          siswa_id: record.siswa_id,
          kelas_id: record.kelas_id,
          mata_pelajaran_id: record.mata_pelajaran_id,
          tanggal: record.tanggal,
          status_kehadiran: record.status_kehadiran,
          keaktifan: record.keaktifan,
          keterangan: record.keterangan,
          tahun_ajaran: activeTahunAjaran || await getActiveTahunAjaran(),
        });
        if (result.error) throw new Error(result.error);
      }

      // Update existing records
      for (const record of toUpdate) {
        const result = await indexedDB.update("kehadiran", record.id!, {
          status_kehadiran: record.status_kehadiran,
          keaktifan: record.keaktifan,
          keterangan: record.keterangan,
        });
        if (result.error) throw new Error(result.error);
      }

      toast({
        variant: "success",
        title: "Berhasil",
        description: "Data kehadiran berhasil disimpan",
      });

      // Refresh data to show updated attendance
      await fetchStudentsAndAttendance();
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data kehadiran",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStats = () => {
    const statuses = Object.values(attendance);
    return {
      hadir: statuses.filter(s => s === 'Hadir').length,
      sakit: statuses.filter(s => s === 'Sakit').length,
      dispen: statuses.filter(s => s === 'Dispen').length,
      izin: statuses.filter(s => s === 'Izin').length,
      alpha: statuses.filter(s => s === 'Alpha').length,
      total: students.length,
    };
  };

  const stats = getAttendanceStats();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Hadir':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Hadir</Badge>;
      case 'Sakit':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Sakit</Badge>;
      case 'Dispen':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">D</Badge>;
      case 'Izin':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Izin</Badge>;
      case 'Alpha':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Alpha</Badge>;
      default:
        return <Badge variant="outline">Belum diisi</Badge>;
    }
  };

  const selectedKelasData = allKelas.find(k => k.id === selectedKelas);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader 
        title="Input Kehadiran" 
        description="Catat kehadiran siswa berdasarkan kelas, mata pelajaran, dan tanggal"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              Filter & Aksi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tanggal" className="text-xs sm:text-sm">Tanggal</Label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tingkat" className="text-xs sm:text-sm">Tingkat Kelas</Label>
              <Select value={selectedTingkat} onValueChange={(value) => {
                setSelectedTingkat(value);
                saveState('tingkat', value);
              }}>
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Pilih tingkat kelas" />
                </SelectTrigger>
                <SelectContent>
                  {tingkatOptions.map((tingkat) => (
                    <SelectItem key={tingkat} value={tingkat}>
                      Kelas {tingkat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kelas" className="text-xs sm:text-sm">Nama Kelas</Label>
              <Select value={selectedKelas} onValueChange={(value) => {
                setSelectedKelas(value);
                saveState('kelas', value);
              }} disabled={!selectedTingkat}>
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Pilih nama kelas" />
                </SelectTrigger>
                <SelectContent>
                  {filteredKelas.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas} {kelas.jurusan ? `- ${kelas.jurusan}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mata-pelajaran" className="text-xs sm:text-sm">Mata Pelajaran</Label>
              <Select value={selectedMataPelajaran} onValueChange={(value) => {
                setSelectedMataPelajaran(value);
                saveState('mata_pelajaran', value);
              }} disabled={!selectedKelas}>
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Pilih mata pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {mataPelajaran.map((mapel) => (
                    <SelectItem key={mapel.id} value={mapel.id}>
                      {mapel.nama_mata_pelajaran} ({mapel.kode_mata_pelajaran})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedKelas && selectedMataPelajaran && (
              <>
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-xs sm:text-sm mb-2">Aksi Massal</h4>
                  <div className="space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full h-10" 
                      onClick={() => handleBulkAttendance('Hadir')}
                      variant="outline"
                    >
                      <CheckCheck className="mr-2 h-4 w-4" />
                      <span className="text-xs sm:text-sm">Semua Hadir</span>
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleSave} 
                  className="w-full h-10"
                  disabled={loading || !selectedKelas || !selectedMataPelajaran}
                >
                  <Save className="mr-2 h-4 w-4" />
                  <span className="text-xs sm:text-sm">{loading ? "Menyimpan..." : "Simpan Kehadiran"}</span>
                </Button>

                <div className="pt-4 border-t space-y-2">
                  <h4 className="font-medium text-xs sm:text-sm">Statistik Hari Ini</h4>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span>Total Siswa:</span>
                      <span className="font-medium">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hadir:</span>
                      <span className="font-medium text-green-600">{stats.hadir}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sakit:</span>
                      <span className="font-medium text-yellow-600">{stats.sakit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dispen:</span>
                      <span className="font-medium text-purple-600">{stats.dispen}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Izin:</span>
                      <span className="font-medium text-blue-600">{stats.izin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Alpha:</span>
                      <span className="font-medium text-red-600">{stats.alpha}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-base sm:text-lg">
                  Daftar Siswa
                  {selectedKelasData && (
                    <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                      {" "}
                      - {selectedKelasData.nama_kelas} {selectedKelasData.jurusan && `- ${selectedKelasData.jurusan}`}
                    </span>
                  )}
                </CardTitle>
                {selectedKelas && selectedMataPelajaran && (
                  <Button 
                    onClick={handleGoToAgenda}
                    variant="outline"
                    size="sm"
                    className="h-10 w-full sm:w-auto"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    <ExternalLink className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Buka Agenda Mengajar</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {todaySchedules.length > 0 && (
                <div className="mb-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4" />
                    <Label className="text-xs sm:text-sm font-medium">Jadwal Hari Ini - Klik untuk mengisi presensi</Label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {todaySchedules.map((schedule) => (
                      <Button
                        key={schedule.jadwal_id}
                        variant="outline"
                        size="sm"
                        className="justify-start text-left h-auto py-2 px-3"
                        onClick={() => handleQuickSelect(schedule)}
                      >
                        <div className="flex items-start gap-2 w-full">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">
                              {schedule.kelas_tingkat} {schedule.kelas_nama}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {schedule.mata_pelajaran_nama}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Jam ke {schedule.jam_ke}{schedule.jumlah_jp > 1 && `-${schedule.jam_ke + schedule.jumlah_jp - 1}`}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {!selectedKelas || !selectedMataPelajaran ? (
                <div className="text-center py-8">
                  <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-xs sm:text-sm text-muted-foreground px-4">Pilih tingkat, nama kelas, dan mata pelajaran untuk menampilkan daftar siswa</p>
                </div>
              ) : loading ? (
                <div className="text-center py-8">
                  <p className="text-xs sm:text-sm text-muted-foreground">Memuat data siswa...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs sm:text-sm text-muted-foreground">Tidak ada siswa dalam kelas ini</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">No</TableHead>
                        <TableHead className="text-xs sm:text-sm">NISN</TableHead>
                        <TableHead className="text-xs sm:text-sm">Nama Siswa</TableHead>
                        <TableHead className="text-center text-xs sm:text-sm">Status Kehadiran</TableHead>
                        <TableHead className="text-center text-xs sm:text-sm">Keaktifan</TableHead>
                        <TableHead className="text-center text-xs sm:text-sm">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium text-xs sm:text-sm">{index + 1}</TableCell>
                          <TableCell className="font-medium text-xs sm:text-sm">{student.nisn}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{student.nama_siswa}</TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(attendance[student.id])}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                              <Button
                                size="sm"
                                variant={keaktifan[student.id] === 'Aktif' ? 'default' : 'outline'}
                                onClick={() => handleKeaktifanChange(student.id, 'Aktif')}
                                className={`h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs ${keaktifan[student.id] === 'Aktif' ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-950 border-yellow-500' : ''}`}
                                title="Siswa Aktif"
                              >
                                <Star className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleKeaktifanChange(student.id, '')}
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs hover:bg-muted"
                                title="Reset"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1 flex-wrap">
                              <Button
                                size="sm"
                                variant={attendance[student.id] === 'Hadir' ? 'default' : 'outline'}
                                onClick={() => handleAttendanceChange(student.id, 'Hadir')}
                                className="h-8 px-2 text-xs"
                              >
                                Hadir
                              </Button>
                              <Button
                                size="sm"
                                variant={attendance[student.id] === 'Sakit' ? 'default' : 'outline'}
                                onClick={() => handleAttendanceChange(student.id, 'Sakit')}
                                className="h-8 px-2 text-xs"
                              >
                                Sakit
                              </Button>
                              <Button
                                size="sm"
                                variant={attendance[student.id] === 'Dispen' ? 'default' : 'outline'}
                                onClick={() => handleAttendanceChange(student.id, 'Dispen')}
                                className="h-8 px-2 text-xs"
                              >
                                Dispen
                              </Button>
                              <Button
                                size="sm"
                                variant={attendance[student.id] === 'Izin' ? 'default' : 'outline'}
                                onClick={() => handleAttendanceChange(student.id, 'Izin')}
                                className="h-8 px-2 text-xs"
                              >
                                Izin
                              </Button>
                              <Button
                                size="sm"
                                variant={attendance[student.id] === 'Alpha' ? 'destructive' : 'outline'}
                                onClick={() => handleAttendanceChange(student.id, 'Alpha')}
                                className="h-8 px-2 text-xs"
                              >
                                Alpha
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InputKehadiran;