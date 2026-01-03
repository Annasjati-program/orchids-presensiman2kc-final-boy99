import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Ekstrakurikuler } from "@/lib/indexedDB";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { AlertCircle, QrCode, Copy, RefreshCw, Calendar, Trash2, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Token {
  id: string;
  token_code: string;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  status: string;
}

const getWIBDate = () => {
  const now = new Date();
  const wibOffset = 7 * 60;
  const utcOffset = now.getTimezoneOffset();
  const totalOffset = wibOffset + utcOffset;
  return new Date(now.getTime() + totalOffset * 60 * 1000);
};

export default function GenerateTokenPage() {
  const [eskul, setEskul] = useState<Ekstrakurikuler | null>(null);
  const [tanggal, setTanggal] = useState<string>(getWIBDate().toISOString().split('T')[0]);
  const [waktuMulai, setWaktuMulai] = useState<string>("14:00");
  const [waktuSelesai, setWaktuSelesai] = useState<string>("16:00");
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadEskulData();
  }, []);

  useEffect(() => {
    if (eskul) {
      loadTokens();
    }
  }, [eskul]);

  const loadTokens = async () => {
    if (!eskul) return;

    try {
      const { data, error } = await supabase
        .from('token_presensi')
        .select('id, token_code, tanggal, waktu_mulai, waktu_selesai, status')
        .eq('ekstrakurikuler_id', eskul.id)
        .order('tanggal', { ascending: false })
        .order('waktu_mulai', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error) {
      console.error("Error loading tokens:", error);
    }
  };

  const loadEskulData = async () => {
    try {
      const { data, error } = await supabase
        .from('ekstrakurikuler')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      
      if (data) {
        setEskul(data as Ekstrakurikuler);
      } else {
        setEskul(null);
      }
    } catch (error) {
      console.error("Error loading eskul:", error);
      setEskul(null);
    }
  };

  const generateToken = async () => {
    if (!eskul) {
      toast.error("Pengaturan ekstrakurikuler belum dibuat");
      return;
    }

    if (!tanggal || !waktuMulai || !waktuSelesai) {
      toast.error("Lengkapi semua field terlebih dahulu");
      return;
    }

    if (waktuMulai >= waktuSelesai) {
      toast.error("Waktu selesai harus lebih besar dari waktu mulai");
      return;
    }

    try {
      setLoading(true);

      const newToken = nanoid(8).toUpperCase();
      
      const { error } = await supabase
        .from('token_presensi')
        .insert({
          ekstrakurikuler_id: eskul.id,
          token_code: newToken,
          tanggal: tanggal,
          waktu_mulai: waktuMulai,
          waktu_selesai: waktuSelesai,
          status: 'aktif'
        });

      if (error) throw error;

      toast.success("Token berhasil dibuat!");
      loadTokens();
      setTanggal(getWIBDate().toISOString().split('T')[0]);
      setWaktuMulai("14:00");
      setWaktuSelesai("16:00");
    } catch (error: any) {
      console.error("Error generating token:", error);
      toast.error(`Gagal membuat token: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteToken = async (tokenId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTokenToDelete(tokenId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!tokenToDelete) return;
    
    try {
      const { error } = await supabase
        .from('token_presensi')
        .delete()
        .eq('id', tokenToDelete);

      if (error) throw error;

      toast.success("Token berhasil dihapus");
      loadTokens();
    } catch (error) {
      console.error("Error deleting token:", error);
      toast.error("Gagal menghapus token");
    } finally {
      setDeleteDialogOpen(false);
      setTokenToDelete(null);
    }
  };

  const copyToken = (tokenCode: string) => {
    navigator.clipboard.writeText(tokenCode);
    toast.success("Token berhasil disalin");
  };

  const downloadQR = (tokenCode: string, date: string) => {
    const svg = document.getElementById(`qr-code-svg-dialog`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${tokenCode}-${date}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR Code berhasil diunduh");
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const getTokenStatus = (token: Token) => {
    if (token.status === 'nonaktif') {
      return { label: 'Nonaktif', variant: 'secondary' as const };
    }

    const now = getWIBDate();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

    if (token.tanggal > today) {
      return { label: 'Akan Datang', variant: 'default' as const };
    } else if (token.tanggal === today) {
      if (currentTime < token.waktu_mulai) {
        return { label: 'Belum Dimulai', variant: 'default' as const };
      } else if (currentTime >= token.waktu_mulai && currentTime <= token.waktu_selesai) {
        return { label: 'Aktif', variant: 'success' as const };
      } else {
        return { label: 'Kadaluarsa', variant: 'destructive' as const };
      }
    }
    return { label: 'Kadaluarsa', variant: 'destructive' as const };
  };

  const handleRowClick = (token: Token) => {
    setSelectedToken(token);
    setShowQRDialog(true);
  };

  if (!eskul) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Generate Token Presensi"
          description="Buat token dan QR code untuk presensi ekstrakurikuler"
        />
        <Card className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Silakan buat pengaturan ekstrakurikuler terlebih dahulu di menu "Kelola Ekstrakurikuler"
            </AlertDescription>
          </Alert>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Generate Token Presensi"
        description={`${eskul.nama_eskul} - Pembimbing: ${eskul.pembimbing}`}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Buat Token Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal</Label>
              <Input
                id="tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waktu-mulai">Waktu Mulai</Label>
              <Input
                id="waktu-mulai"
                type="time"
                value={waktuMulai}
                onChange={(e) => setWaktuMulai(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waktu-selesai">Waktu Selesai</Label>
              <Input
                id="waktu-selesai"
                type="time"
                value={waktuSelesai}
                onChange={(e) => setWaktuSelesai(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={generateToken}
                className="w-full"
                disabled={loading}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Generate Token
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Daftar Token
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {tokens.length} Token
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Belum ada token. Silakan generate token baru.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Token</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => {
                    const status = getTokenStatus(token);
                    return (
                      <TableRow 
                        key={token.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(token)}
                      >
                        <TableCell className="font-mono font-bold">{token.token_code}</TableCell>
                        <TableCell>{new Date(token.tanggal).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>{token.waktu_mulai} - {token.waktu_selesai}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDeleteToken(token.id, e)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Token</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus token ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Token</DialogTitle>
          </DialogHeader>
          {selectedToken && (
            <div className="flex flex-col items-center space-y-4">
              <QRCodeSVG
                id="qr-code-svg-dialog"
                value={selectedToken.token_code}
                size={280}
                level="H"
                includeMargin={true}
              />
              
              <div className="w-full space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={selectedToken.token_code}
                    readOnly
                    className="text-center text-xl font-bold tracking-wider font-mono"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToken(selectedToken.token_code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tanggal:</span>
                    <span className="font-medium">{new Date(selectedToken.tanggal).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Waktu:</span>
                    <span className="font-medium">{selectedToken.waktu_mulai} - {selectedToken.waktu_selesai}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={getTokenStatus(selectedToken).variant}>
                      {getTokenStatus(selectedToken).label}
                    </Badge>
                  </div>
                </div>

                <Button 
                  onClick={() => downloadQR(selectedToken.token_code, selectedToken.tanggal)}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}