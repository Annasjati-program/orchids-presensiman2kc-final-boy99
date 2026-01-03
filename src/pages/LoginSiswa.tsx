import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { GraduationCap, Lock, User, Info, Download, CheckCircle, Share, MoreVertical } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export default function LoginSiswa() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const navigate = useNavigate();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // Detect browser and OS for install instructions
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowInstallGuide(true);
    }
  };

  useEffect(() => {
    const savedUsername = localStorage.getItem("siswa_remember_username");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error("Username dan password harus diisi");
      return;
    }

    setLoading(true);

    try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/anggota_eskul?select=*,ekstrakurikuler:ekstrakurikuler_id(nama_eskul)&username=ilike.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(password)}`,
          {
            headers: {
              'apikey': SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const result = await response.json();
        
        if (!response.ok || !result || result.length === 0) {
          toast.error("Username atau password salah");
          setLoading(false);
          return;
        }
        
        const data = result[0];

        const siswaData = {
          id: data.id,
          nama: data.nama_siswa,
          username: data.username,
          tingkat: data.tingkat,
          kelas: data.nama_kelas,
          ekstrakurikuler_id: data.ekstrakurikuler_id,
          eskul_nama: data.ekstrakurikuler?.nama_eskul || "-",
          password: data.password,
          foto_url: data.foto_url
        };

      if (rememberMe) {
        localStorage.setItem("siswa_remember_username", username);
      } else {
        localStorage.removeItem("siswa_remember_username");
      }

      localStorage.setItem("siswa_logged_in", JSON.stringify(siswaData));
      toast.success("Login berhasil!");
      navigate("/siswa/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  };

    return (
      <div className="light min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-4">
      <Card className="w-full max-w-[380px] shadow-2xl border-0 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"></div>
        
          <CardHeader className="text-center pt-8 pb-6 px-6 space-y-2">
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg mb-2">
            <GraduationCap className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Login Siswa
          </CardTitle>
          <p className="text-xs text-gray-600 font-medium">Portal Presensi Ekstrakurikuler</p>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10 text-sm border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 rounded-lg"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Password
              </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 text-sm border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 rounded-lg"
                  disabled={loading}
                />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={loading}
                className="w-4 h-4"
              />
              <Label 
                htmlFor="remember" 
                className="text-xs text-gray-600 cursor-pointer"
              >
                Ingat username
              </Label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
              <div className="flex gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900">
                  <span className="font-semibold">Lupa password?</span> Hubungi guru pembimbing ekstrakurikuler
                </p>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-10 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-semibold shadow-md text-sm rounded-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </div>
              ) : (
                "Masuk"
              )}
            </Button>

<div className="text-center pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="text-xs font-medium text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg h-8"
                >
                  Login sebagai Guru
                </Button>
              </div>

<div className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleInstallClick}
                        disabled={isInstalled}
                        className="w-full h-9 text-xs font-medium border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300 rounded-lg gap-2"
                      >
                        {isInstalled ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Aplikasi Terinstall
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Install Aplikasi
                          </>
                        )}
                      </Button>
                    </div>
            </form>
          </CardContent>
        </Card>

        {/* Install Guide Dialog */}
        <Dialog open={showInstallGuide} onOpenChange={setShowInstallGuide}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-violet-700">
                Cara Install Aplikasi
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-4 pt-4">
                  {isIOS || isSafari ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 font-medium">Untuk iPhone/iPad (Safari):</p>
                      <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                        <li className="flex items-start gap-2">
                          <span>1.</span>
                          <span>Ketuk ikon <Share className="w-4 h-4 inline text-blue-500" /> (Share) di bagian bawah browser</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>2.</span>
                          <span>Scroll ke bawah dan pilih <strong>"Add to Home Screen"</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>3.</span>
                          <span>Ketuk <strong>"Add"</strong> di pojok kanan atas</span>
                        </li>
                      </ol>
                    </div>
                  ) : isAndroid && isChrome ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 font-medium">Untuk Android (Chrome):</p>
                      <ol className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-start gap-2">
                          <span>1.</span>
                          <span>Ketuk ikon <MoreVertical className="w-4 h-4 inline text-gray-500" /> (menu titik tiga) di pojok kanan atas</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>2.</span>
                          <span>Pilih <strong>"Install app"</strong> atau <strong>"Add to Home screen"</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>3.</span>
                          <span>Ketuk <strong>"Install"</strong></span>
                        </li>
                      </ol>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 font-medium">Untuk Desktop (Chrome/Edge):</p>
                      <ol className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-start gap-2">
                          <span>1.</span>
                          <span>Klik ikon <Download className="w-4 h-4 inline text-gray-500" /> di address bar (pojok kanan)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>2.</span>
                          <span>Atau klik menu <MoreVertical className="w-4 h-4 inline text-gray-500" /> lalu pilih <strong>"Install EduShift..."</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>3.</span>
                          <span>Klik <strong>"Install"</strong></span>
                        </li>
                      </ol>
                    </div>
                  )}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                    <p className="text-xs text-amber-800">
                      <strong>Catatan:</strong> Pastikan Anda membuka aplikasi dari browser (bukan dalam aplikasi lain seperti Instagram/Facebook) untuk dapat menginstall.
                    </p>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
