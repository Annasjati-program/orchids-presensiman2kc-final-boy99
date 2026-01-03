import { useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { siswaService, kelasService, type Siswa } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

export default function DatabaseIntegrationExample() {
  const { data: siswaList, loading, create, update, remove, fetchAll } = useDatabase<Siswa>(siswaService);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    nisn: '',
    nama_siswa: '',
    kelas_id: '',
    jenis_kelamin: 'Laki-laki',
    tanggal_lahir: '',
    tanggal_masuk: new Date().toISOString().split('T')[0],
    status: 'Aktif',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create(formData);
      toast({ title: 'Berhasil', description: 'Data siswa berhasil ditambahkan' });
      setFormData({
        nisn: '',
        nama_siswa: '',
        kelas_id: '',
        jenis_kelamin: 'Laki-laki',
        tanggal_lahir: '',
        tanggal_masuk: new Date().toISOString().split('T')[0],
        status: 'Aktif',
      });
    } catch (err) {
      toast({ 
        title: 'Gagal', 
        description: (err as Error).message,
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast({ title: 'Berhasil', description: 'Data siswa berhasil dihapus' });
    } catch (err) {
      toast({ 
        title: 'Gagal', 
        description: (err as Error).message,
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contoh Integrasi Database</h1>
        <p className="text-muted-foreground">Mengelola data siswa dengan Supabase</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Siswa Baru</CardTitle>
          <CardDescription>Form untuk menambahkan data siswa</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nisn">NISN</Label>
                <Input
                  id="nisn"
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nama">Nama Siswa</Label>
                <Input
                  id="nama"
                  value={formData.nama_siswa}
                  onChange={(e) => setFormData({ ...formData, nama_siswa: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="kelas_id">Kelas ID</Label>
                <Input
                  id="kelas_id"
                  value={formData.kelas_id}
                  onChange={(e) => setFormData({ ...formData, kelas_id: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                <select
                  id="jenis_kelamin"
                  value={formData.jenis_kelamin}
                  onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                  className="w-full border rounded-md p-2"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                <Input
                  id="tanggal_lahir"
                  type="date"
                  value={formData.tanggal_lahir}
                  onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tanggal_masuk">Tanggal Masuk</Label>
                <Input
                  id="tanggal_masuk"
                  type="date"
                  value={formData.tanggal_masuk}
                  onChange={(e) => setFormData({ ...formData, tanggal_masuk: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button type="submit">Tambah Siswa</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${siswaList.length} siswa terdaftar`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NISN</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jenis Kelamin</TableHead>
                <TableHead>Tanggal Masuk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {siswaList.map((siswa) => (
                <TableRow key={siswa.id}>
                  <TableCell>{siswa.nisn}</TableCell>
                  <TableCell>{siswa.nama_siswa}</TableCell>
                  <TableCell>{siswa.jenis_kelamin}</TableCell>
                  <TableCell>{siswa.tanggal_masuk}</TableCell>
                  <TableCell>{siswa.status}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(siswa.id)}
                    >
                      Hapus
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
