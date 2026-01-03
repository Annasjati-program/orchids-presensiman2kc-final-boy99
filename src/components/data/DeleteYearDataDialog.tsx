import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface YearDataStats {
  tahunAjaran: string;
  totalKelas: number;
  totalSiswa: number;
  totalNilai: number;
  totalKehadiran: number;
  totalJadwal: number;
  totalAgenda: number;
}

interface DeleteYearDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yearStats: YearDataStats | null;
  onDeleteSuccess: () => void;
}

export function DeleteYearDataDialog({
  open,
  onOpenChange,
  yearStats,
  onDeleteSuccess,
}: DeleteYearDataDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!yearStats) return;
    
    if (confirmText !== "HAPUS") {
      toast({
        title: "Konfirmasi Gagal",
        description: "Silakan ketik HAPUS untuk melanjutkan penghapusan",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      const { tahunAjaran } = yearStats;
      
      const { data: kelasList } = await supabase
        .from('kelas')
        .select('id')
        .eq('tahun_ajaran', tahunAjaran);
      
      const kelasIds = kelasList?.map((k: any) => k.id) || [];
      
      if (kelasIds.length > 0) {
        const { data: siswaList } = await supabase
          .from('siswa')
          .select('id')
          .in('kelas_id', kelasIds);
        
        const siswaIds = siswaList?.map((s: any) => s.id) || [];
        
        if (siswaIds.length > 0) {
          await supabase
            .from('nilai_siswa')
            .delete()
            .in('siswa_id', siswaIds)
            .eq('tahun_ajaran', tahunAjaran);
        }
        
        await supabase
          .from('kehadiran')
          .delete()
          .in('kelas_id', kelasIds);
        
        if (siswaIds.length > 0) {
          await supabase
            .from('siswa')
            .delete()
            .in('id', siswaIds);
        }
        
        await supabase
          .from('kelas')
          .delete()
          .in('id', kelasIds);
      }
      
      await supabase
        .from('jadwal_pelajaran')
        .delete()
        .eq('tahun_ajaran', tahunAjaran);
      
      await supabase
        .from('agenda_mengajar')
        .delete()
        .eq('tahun_ajaran', tahunAjaran);
      
      toast({
        variant: "success",
        title: "Berhasil",
        description: `Data tahun ajaran ${tahunAjaran} berhasil dihapus`,
      });
      
      setConfirmText("");
      onOpenChange(false);
      onDeleteSuccess();
    } catch (error) {
      console.error("Error deleting year data:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus data tahun ajaran",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    onOpenChange(false);
  };

  if (!yearStats) return null;

  const isConfirmValid = confirmText === "HAPUS";
  const totalData = yearStats.totalKelas + yearStats.totalSiswa + yearStats.totalNilai + 
                    yearStats.totalKehadiran + yearStats.totalJadwal + yearStats.totalAgenda;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Hapus Data Tahun Ajaran
          </DialogTitle>
          <DialogDescription>
            Tindakan ini akan menghapus SEMUA data terkait tahun ajaran ini dan tidak dapat dibatalkan!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 space-y-2">
            <h4 className="font-semibold text-sm">Tahun Ajaran: {yearStats.tahunAjaran}</h4>
            <div className="text-sm space-y-1">
              <p>• Kelas: {yearStats.totalKelas}</p>
              <p>• Siswa: {yearStats.totalSiswa}</p>
              <p>• Data Nilai: {yearStats.totalNilai}</p>
              <p>• Data Kehadiran: {yearStats.totalKehadiran}</p>
              <p>• Jadwal Pelajaran: {yearStats.totalJadwal}</p>
              <p>• Agenda Mengajar: {yearStats.totalAgenda}</p>
              <p className="font-semibold pt-2 border-t">Total Data: {totalData} record</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-text">
              Ketik <span className="font-bold text-destructive">HAPUS</span> untuk konfirmasi
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Ketik HAPUS"
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Batal
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting}
          >
            {isDeleting ? "Menghapus..." : "Hapus Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}