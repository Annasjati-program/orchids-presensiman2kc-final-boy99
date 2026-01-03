import { useState } from 'react';
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useStorageMonitor, formatBytes } from "@/hooks/useStorageMonitor";
import { MigrationDialog } from "@/components/data/MigrationDialog";
import { Database, HardDrive, RefreshCw, AlertCircle, CheckCircle2, XCircle, FileText, AlertTriangle, ArrowRight, Loader2, ChevronDown, Cpu, Archive, Cloud, CloudOff } from "lucide-react";
import { toast } from "sonner";

export default function StorageMonitor() {
  const { storageData, loading, error, refresh } = useStorageMonitor();
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [indexedDBOpen, setIndexedDBOpen] = useState(false);
  const [localStorageOpen, setLocalStorageOpen] = useState(false);
  const [cacheOpen, setCacheOpen] = useState(false);
  const [supabaseOpen, setSupabaseOpen] = useState(false);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refresh();
      toast.success('Data storage berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui data storage');
    } finally {
      setRefreshing(false);
    }
  };

  const handleMigrationComplete = () => {
    setShowMigrationDialog(false);
    sessionStorage.removeItem('needsMigration');
    sessionStorage.removeItem('migrationData');
    handleRefresh();
  };

  const getStorageStatus = (percentage: number) => {
    if (percentage < 50) return { color: "text-green-600", icon: CheckCircle2, label: "Aman" };
    if (percentage < 75) return { color: "text-yellow-600", icon: AlertCircle, label: "Peringatan" };
    return { color: "text-red-600", icon: XCircle, label: "Kritis" };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Storage Monitor"
          description="Pantau penggunaan penyimpanan lokal aplikasi"
        />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !storageData) {
    return (
      <div className="p-6">
        <PageHeader
          title="Storage Monitor"
          description="Pantau penggunaan penyimpanan lokal aplikasi"
        />
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Gagal memuat data storage"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const status = getStorageStatus(storageData.total.percentage);
  const StatusIcon = status.icon;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Storage Monitor"
          description="Pantau penggunaan penyimpanan offline dan online"
        />
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Total Storage Overview */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Storage Lokal (Offline)
              </CardTitle>
              <CardDescription>
                Penggunaan storage browser lokal
              </CardDescription>
            </div>
            <div className={`flex items-center gap-2 ${status.color}`}>
              <StatusIcon className="h-5 w-5" />
              <span className="font-semibold">{status.label}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Terpakai</span>
              <span className="font-medium">
                {formatBytes(storageData.total.used)} / {formatBytes(storageData.total.total)}
              </span>
            </div>
            <Progress value={storageData.total.percentage} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {storageData.total.percentage.toFixed(2)}% terpakai
            </p>
          </div>

          {storageData.total.percentage > 75 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Storage hampir penuh! Pertimbangkan untuk menghapus data lama atau melakukan backup dan clear.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Supabase Online Storage */}
      <Card className="border-blue-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {storageData.supabase.connected ? (
                  <Cloud className="h-5 w-5 text-blue-500" />
                ) : (
                  <CloudOff className="h-5 w-5 text-gray-400" />
                )}
                Storage Online (Supabase)
              </CardTitle>
              <CardDescription>
                Database cloud yang tersimpan di Supabase
              </CardDescription>
            </div>
            {storageData.supabase.connected ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Terhubung
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                <CloudOff className="h-3 w-3 mr-1" />
                Tidak Terhubung
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {storageData.supabase.connected ? (
            <>
              <div className="text-center py-4">
                <p className="text-4xl font-bold">{formatBytes(storageData.supabase.size)}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {storageData.supabase.tables.length} tabel di cloud
                </p>
              </div>

              {storageData.supabase.tables.length > 0 && (
                <Collapsible open={supabaseOpen} onOpenChange={setSupabaseOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${supabaseOpen ? 'rotate-180' : ''}`} />
                      {supabaseOpen ? 'Sembunyikan' : 'Lihat'} Rincian Tabel
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {storageData.supabase.tables.map((table) => (
                          <div key={table.name} className="p-3 border rounded-lg space-y-1 bg-blue-500/5">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{table.name}</p>
                              </div>
                              <div className="text-right ml-2">
                                <p className="font-semibold text-sm">{formatBytes(table.size)}</p>
                                <p className="text-xs text-muted-foreground">{table.count} records</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tidak dapat terhubung ke Supabase. Pastikan koneksi internet Anda aktif.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          <strong>Info Penyimpanan:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• <strong>Storage Offline</strong>: Data tersimpan di browser (tersedia tanpa internet)</li>
            <li>• <strong>Storage Online (Supabase)</strong>: Data tersimpan di cloud (perlu internet, dapat diakses dari perangkat lain)</li>
            <li>• <strong>localStorage</strong>: Storage untuk pengaturan dan preferensi</li>
            <li>• <strong>IndexedDB</strong>: Database untuk data lokal (backup offline)</li>
            <li>• <strong>OPFS</strong>: File system untuk foto profil dan dokumen</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <strong>Catatan:</strong> Aplikasi ini bekerja hybrid - data utama tersimpan di Supabase (online) dan dapat di-backup ke storage lokal untuk akses offline.
      </div>

      {/* Offline Storage Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Detail Storage Offline</h3>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* IndexedDB */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                IndexedDB
              </CardTitle>
              <CardDescription>Database lokal untuk backup offline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <div className="text-center py-4">
                <p className="text-3xl font-bold">{formatBytes(storageData.indexedDB.size)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {storageData.indexedDB.tables.length} tabel
                </p>
              </div>

              {storageData.indexedDB.tables.length > 0 ? (
                <Collapsible open={indexedDBOpen} onOpenChange={setIndexedDBOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${indexedDBOpen ? 'rotate-180' : ''}`} />
                      {indexedDBOpen ? 'Sembunyikan' : 'Lihat'} Rincian Tabel
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {storageData.indexedDB.tables.map((table) => (
                          <div key={table.name} className="p-3 border rounded-lg space-y-1">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{table.name}</p>
                              </div>
                              <div className="text-right ml-2">
                                <p className="font-semibold text-sm">{formatBytes(table.size)}</p>
                                <p className="text-xs text-muted-foreground">{table.count} records</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    IndexedDB kosong. Data utama disimpan di Supabase.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* localStorage */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                localStorage
              </CardTitle>
              <CardDescription>Storage untuk preferensi dan pengaturan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <div className="text-center py-4">
                <p className="text-3xl font-bold">{formatBytes(storageData.localStorage.size)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {storageData.localStorage.items.length} items
                </p>
              </div>

              <Collapsible open={localStorageOpen} onOpenChange={setLocalStorageOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${localStorageOpen ? 'rotate-180' : ''}`} />
                    {localStorageOpen ? 'Sembunyikan' : 'Lihat'} Rincian Items
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {storageData.localStorage.items.map((item) => (
                        <div key={item.key} className="p-3 border rounded-lg space-y-1">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.key}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                              )}
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-semibold text-sm">{formatBytes(item.size)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* OPFS */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                OPFS
              </CardTitle>
              <CardDescription>Origin Private File System</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              {storageData.opfs.supported ? (
                <>
                  <div className="text-center py-4">
                    <p className="text-3xl font-bold">{formatBytes(storageData.opfs.size)}</p>
                    <p className="text-sm text-muted-foreground mt-1">File storage</p>
                  </div>

                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      OPFS aktif untuk foto profil, logo sekolah, dan file lainnya
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    OPFS tidak didukung. File disimpan sebagai base64 di localStorage (kurang efisien).
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Memory & Cache Storage */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cache Storage */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Cache Storage
            </CardTitle>
            <CardDescription>Data cache untuk mempercepat loading</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col">
            {storageData.cache.supported ? (
              <>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold">{formatBytes(storageData.cache.size)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {storageData.cache.caches.length} cache{storageData.cache.caches.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {storageData.cache.caches.length > 0 ? (
                  <Collapsible open={cacheOpen} onOpenChange={setCacheOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${cacheOpen ? 'rotate-180' : ''}`} />
                        {cacheOpen ? 'Sembunyikan' : 'Lihat'} Rincian Cache
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <div className="space-y-3">
                        {storageData.cache.caches.map((cache) => (
                          <div key={cache.name} className="p-3 border rounded-lg space-y-1">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{cache.name}</p>
                              </div>
                              <div className="text-right ml-2">
                                <p className="font-semibold text-sm">{formatBytes(cache.size)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Tidak ada cache tersimpan saat ini
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Cache Storage tidak didukung di browser ini
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Memory (RAM)
            </CardTitle>
            <CardDescription>Penggunaan memori JavaScript runtime</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col">
            {storageData.memory.jsHeapSizeLimit > 0 ? (
              <>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold">{formatBytes(storageData.memory.jsHeapSize)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    dari {formatBytes(storageData.memory.jsHeapSizeLimit)} limit
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Heap Terpakai</span>
                      <span className="font-medium">{formatBytes(storageData.memory.jsHeapSize)}</span>
                    </div>
                    <Progress 
                      value={(storageData.memory.jsHeapSize / storageData.memory.jsHeapSizeLimit) * 100} 
                      className="h-2" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">Total Heap</p>
                      <p className="text-sm font-semibold">{formatBytes(storageData.memory.totalJSHeapSize)}</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">Limit</p>
                      <p className="text-sm font-semibold">{formatBytes(storageData.memory.jsHeapSizeLimit)}</p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Memory akan otomatis dibersihkan oleh garbage collector
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Informasi memory tidak tersedia di browser ini (hanya Chrome/Edge)
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Rekomendasi Optimasi</CardTitle>
          <CardDescription>Tips untuk mengoptimalkan penggunaan storage</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Data utama tersimpan otomatis di Supabase (online) dan dapat diakses dari perangkat lain</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Lakukan backup berkala dan hapus data lama yang tidak diperlukan</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Gunakan fitur Export untuk mengarsipkan data semester sebelumnya</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Kompres gambar sebelum upload untuk menghemat storage</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}