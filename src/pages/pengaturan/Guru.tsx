import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { guruService } from "@/lib/supabase-client";
import { toast } from "sonner";

interface Guru {
  id: string;
  nama_guru: string;
  nip: string;
  mata_pelajaran: string;
  email: string;
  telepon: string;
  created_at: string;
  updated_at: string;
}

const CACHE_KEY = "guru_data";

const Guru = () => {
  const [data, setData] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);

  const columns = useMemo(
    () => [
      { key: "no", label: "No", sortable: false },
      { key: "nama_guru", label: "Nama Guru", sortable: true },
      { key: "nip", label: "NIP", sortable: true },
      { key: "mata_pelajaran", label: "Mata Pelajaran", sortable: true },
      { key: "email", label: "Email", sortable: true },
      { key: "telepon", label: "Telepon", sortable: true },
    ],
    []
  );

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    const cached = sessionStorage.getItem(CACHE_KEY);

    if (!data.length && cached) {
      try {
        const parsedData = JSON.parse(cached);
        setData(parsedData);
        setLoading(false);
        return;
      } catch (e) {
        sessionStorage.removeItem(CACHE_KEY);
      }
    }

    if (!data.length) setLoading(true);

    try {
      const { data: guru, error } = await guruService.getAll();

      if (error) {
        toast.error(error.message);
        return;
      }

      const dataWithNumbers = (guru || []).map((item, index) => ({
        ...item,
        no: (index + 1).toString(),
      }));

      setData(dataWithNumbers);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(dataWithNumbers));
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (formData: Record<string, string>) => {
    try {
      const { error } = await guruService.create({
        nama_guru: formData.nama_guru,
        nip: formData.nip,
        mata_pelajaran: formData.mata_pelajaran,
        email: formData.email,
        telepon: formData.telepon || null,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Data guru berhasil ditambahkan");
      sessionStorage.removeItem(CACHE_KEY);
      fetchData();
    } catch (error) {
      toast.error("Terjadi kesalahan saat menambahkan data");
    }
  };

  const handleEdit = async (id: string, formData: Record<string, string>) => {
    try {
      const { error } = await guruService.update(id, {
        nama_guru: formData.nama_guru,
        nip: formData.nip,
        mata_pelajaran: formData.mata_pelajaran,
        email: formData.email,
        telepon: formData.telepon || null,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Data guru berhasil diperbarui");
      sessionStorage.removeItem(CACHE_KEY);
      fetchData();
    } catch (error) {
      toast.error("Terjadi kesalahan saat memperbarui data");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await guruService.delete(id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Data guru berhasil dihapus");
      sessionStorage.removeItem(CACHE_KEY);
      fetchData();
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus data");
    }
  };

  const handleImport = async (importData: Record<string, string>[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of importData) {
        try {
          if (!row.nama_guru || !row.nip) {
            errors.push(`Baris dengan NIP "${row.nip || "kosong"}" - Nama Guru dan NIP harus diisi`);
            errorCount++;
            continue;
          }

          const { data: allGuru } = await guruService.getAll();
          const existingGuru = allGuru?.find((g) => g.nip === row.nip);
          if (existingGuru) {
            errors.push(`NIP "${row.nip}" sudah ada dalam database`);
            errorCount++;
            continue;
          }

          const { error } = await guruService.create({
            nama_guru: row.nama_guru,
            nip: row.nip,
            mata_pelajaran: row.mata_pelajaran || "",
            email: row.email || "",
            telepon: row.telepon || null,
          });

          if (error) {
            errors.push(`NIP "${row.nip}" - ${error.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error: any) {
          errors.push(`NIP "${row.nip}" - ${error.message}`);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} guru berhasil diimport${errorCount > 0 ? `, ${errorCount} gagal` : ""}`);
      }

      if (errorCount > 0 && errors.length > 0) {
        console.error("Import errors:", errors);
        toast.error(`${errorCount} data gagal diimport. Periksa konsol untuk detail error.`);
      }

      sessionStorage.removeItem(CACHE_KEY);
      fetchData();
    } catch (error: any) {
      toast.error("Gagal mengimport data: " + error.message);
    }
  };

  const formFields = [
    {
      key: "nama_guru",
      label: "Nama Guru",
      type: "text" as const,
      placeholder: "Masukkan nama guru",
      required: true,
    },
    {
      key: "nip",
      label: "NIP",
      type: "text" as const,
      placeholder: "Masukkan NIP",
      required: true,
    },
    {
      key: "mata_pelajaran",
      label: "Mata Pelajaran",
      type: "text" as const,
      placeholder: "Masukkan mata pelajaran",
      required: true,
    },
    {
      key: "email",
      label: "Email",
      type: "email" as const,
      placeholder: "Masukkan email",
      required: true,
    },
    {
      key: "telepon",
      label: "Telepon",
      type: "text" as const,
      placeholder: "Masukkan nomor telepon",
      required: false,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Guru"
        description="Kelola data guru dan informasi mengajar"
      />

      <DataTable
        data={data}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDeleteBulk={async (ids) => {
          for (const id of ids) {
            await handleDelete(id);
          }
        }}
        onImport={handleImport}
        loading={loading}
        formFields={formFields}
        searchPlaceholder="Cari nama guru, NIP, atau mata pelajaran..."
        title="Daftar Guru"
        tableId="guru"
        enableCheckbox={true}
      />
    </div>
  );
};

export default Guru;
