import * as XLSX from 'xlsx';

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: Array<{ row: number; message: string }>;
  totalRows: number;
}

export interface StudentImportData {
  nisn: string;
  nama: string;
  kelas: string;
  jenis_kelamin: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
  no_telepon?: string;
  email?: string;
}

function validateStudentRow(row: any, rowIndex: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!row.nisn || row.nisn.toString().trim() === '') {
    errors.push(`Baris ${rowIndex}: NISN tidak boleh kosong`);
  }

  if (!row.nama || row.nama.toString().trim() === '') {
    errors.push(`Baris ${rowIndex}: Nama tidak boleh kosong`);
  }

  if (!row.kelas || row.kelas.toString().trim() === '') {
    errors.push(`Baris ${rowIndex}: Kelas tidak boleh kosong`);
  }

  if (!row.jenis_kelamin || !['L', 'P', 'Laki-laki', 'Perempuan'].includes(row.jenis_kelamin)) {
    errors.push(`Baris ${rowIndex}: Jenis kelamin harus L/P atau Laki-laki/Perempuan`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function normalizeStudentData(row: any): StudentImportData {
  let jenisKelamin = row.jenis_kelamin?.toString().trim() || '';
  if (jenisKelamin === 'L' || jenisKelamin.toLowerCase() === 'laki-laki') {
    jenisKelamin = 'Laki-laki';
  } else if (jenisKelamin === 'P' || jenisKelamin.toLowerCase() === 'perempuan') {
    jenisKelamin = 'Perempuan';
  }

  return {
    nisn: row.nisn?.toString().trim() || '',
    nama: row.nama?.toString().trim() || '',
    kelas: row.kelas?.toString().trim() || '',
    jenis_kelamin: jenisKelamin,
    tempat_lahir: row.tempat_lahir?.toString().trim() || '',
    tanggal_lahir: row.tanggal_lahir?.toString().trim() || '',
    alamat: row.alamat?.toString().trim() || '',
    no_telepon: row.no_telepon?.toString().trim() || '',
    email: row.email?.toString().trim() || '',
  };
}

export async function importStudentsFromExcel(file: File): Promise<ImportResult<StudentImportData>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (rawData.length < 2) {
          resolve({
            success: false,
            data: [],
            errors: [{ row: 0, message: 'File Excel kosong atau tidak memiliki data' }],
            totalRows: 0,
          });
          return;
        }

        const headers = (rawData[0] as any[]).map((h: any) => h?.toString().toLowerCase().trim());
        const dataRows = rawData.slice(1) as any[][];

        const headerMapping: Record<string, string> = {
          'nisn': 'nisn',
          'nama': 'nama',
          'nama lengkap': 'nama',
          'kelas': 'kelas',
          'jenis kelamin': 'jenis_kelamin',
          'jk': 'jenis_kelamin',
          'tempat lahir': 'tempat_lahir',
          'tanggal lahir': 'tanggal_lahir',
          'tgl lahir': 'tanggal_lahir',
          'alamat': 'alamat',
          'no telepon': 'no_telepon',
          'no. telepon': 'no_telepon',
          'telepon': 'no_telepon',
          'hp': 'no_telepon',
          'email': 'email',
        };

        const columnIndices: Record<string, number> = {};
        headers.forEach((header, idx) => {
          const mappedKey = headerMapping[header];
          if (mappedKey) {
            columnIndices[mappedKey] = idx;
          }
        });

        if (!columnIndices['nisn'] || !columnIndices['nama'] || !columnIndices['kelas'] || !columnIndices['jenis_kelamin']) {
          resolve({
            success: false,
            data: [],
            errors: [{
              row: 0,
              message: 'Kolom wajib tidak ditemukan. Pastikan file memiliki kolom: NISN, Nama, Kelas, Jenis Kelamin',
            }],
            totalRows: 0,
          });
          return;
        }

        const validData: StudentImportData[] = [];
        const errorList: Array<{ row: number; message: string }> = [];

        dataRows.forEach((row, idx) => {
          const rowIndex = idx + 2;

          if (!row || row.every((cell: any) => !cell)) {
            return;
          }

          const rowData: any = {};
          Object.keys(columnIndices).forEach((key) => {
            const colIdx = columnIndices[key];
            rowData[key] = row[colIdx] || '';
          });

          const validation = validateStudentRow(rowData, rowIndex);

          if (validation.valid) {
            const normalized = normalizeStudentData(rowData);
            validData.push(normalized);
          } else {
            validation.errors.forEach((error) => {
              errorList.push({ row: rowIndex, message: error });
            });
          }
        });

        resolve({
          success: errorList.length === 0,
          data: validData,
          errors: errorList,
          totalRows: dataRows.length,
        });
      } catch (error: any) {
        reject(new Error(`Gagal membaca file Excel: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file'));
    };

    reader.readAsBinaryString(file);
  });
}

export async function importSiswaFromExcel(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData: any[] = XLSX.utils.sheet_to_json(firstSheet);

        if (rawData.length === 0) {
          reject(new Error('File Excel kosong atau tidak memiliki data'));
          return;
        }

        const mappedData = rawData.map((row: any) => ({
          nisn: row['NISN']?.toString().trim() || '',
          nama_siswa: row['Nama Siswa']?.toString().trim() || '',
          jenis_kelamin: row['Jenis Kelamin']?.toString().trim() || 'Laki-laki',
          tempat_lahir: row['Tempat Lahir']?.toString().trim() || '',
          tanggal_lahir: row['Tanggal Lahir']?.toString() || '',
          tanggal_masuk: row['Tanggal Masuk']?.toString() || '',
          alamat: row['Alamat']?.toString().trim() || '',
          nama_orang_tua: row['Nama Orang Tua']?.toString().trim() || '',
          telepon_orang_tua: row['Telepon Orang Tua']?.toString().trim() || '',
          email: row['Email']?.toString().trim() || '',
          status: row['Status']?.toString().trim() || 'Aktif',
        }));

        resolve(mappedData);
      } catch (error: any) {
        reject(new Error(`Gagal membaca file Excel: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file'));
    };

    reader.readAsBinaryString(file);
  });
}

export function downloadStudentImportTemplate() {
  const wb = XLSX.utils.book_new();
  
  const headers = [
    'NISN',
    'Nama Lengkap',
    'Kelas',
    'Jenis Kelamin',
    'Tempat Lahir',
    'Tanggal Lahir',
    'Alamat',
    'No. Telepon',
    'Email',
  ];

  const sampleData = [
    ['1234567890', 'Ahmad Fauzi', '10A', 'Laki-laki', 'Jakarta', '2008-01-15', 'Jl. Merdeka No. 10', '081234567890', 'ahmad@email.com'],
    ['0987654321', 'Siti Nurhaliza', '10A', 'Perempuan', 'Bandung', '2008-03-20', 'Jl. Sudirman No. 20', '081234567891', 'siti@email.com'],
    ['1122334455', 'Budi Santoso', '10B', 'L', 'Surabaya', '2008-05-10', 'Jl. Pahlawan No. 5', '081234567892', 'budi@email.com'],
  ];

  const wsData = [headers, ...sampleData];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 10 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 35 },
    { wch: 15 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');

  XLSX.writeFile(wb, 'Template_Import_Siswa.xlsx');
}

export function downloadSiswaTemplate() {
  const wb = XLSX.utils.book_new();
  
  const headers = [
    'NISN',
    'Nama Siswa',
    'Jenis Kelamin',
    'Tanggal Masuk',
    'Tempat Lahir',
    'Tanggal Lahir',
    'Alamat',
    'Nama Orang Tua',
    'Telepon Orang Tua',
    'Email',
    'Status',
  ];

  const instructionRow = [
    'Contoh: 1234567890',
    'Contoh: Ahmad Fauzi',
    'Isi dengan: Laki-laki atau Perempuan',
    'Format: DD/MM/YYYY atau 15/01/2024',
    'Contoh: Jakarta',
    'Format: DD/MM/YYYY atau 15/01/2008',
    'Contoh: Jl. Merdeka No. 10',
    'Contoh: Budi Santoso',
    'Contoh: 081234567890',
    'Contoh: ahmad@email.com',
    'Isi dengan: Aktif atau Tidak Aktif',
  ];

  const sampleData = [
    ['1234567890', 'Ahmad Fauzi', 'Laki-laki', '15/07/2024', 'Jakarta', '15/01/2008', 'Jl. Merdeka No. 10', 'Budi Santoso', '081234567890', 'ahmad@email.com', 'Aktif'],
    ['0987654321', 'Siti Nurhaliza', 'Perempuan', '15/07/2024', 'Bandung', '20/03/2008', 'Jl. Sudirman No. 20', 'Ahmad Hidayat', '081234567891', 'siti@email.com', 'Aktif'],
  ];

  const wsData = [headers, instructionRow, ...sampleData];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 35 },
    { wch: 25 },
    { wch: 15 },
    { wch: 25 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');

  XLSX.writeFile(wb, 'Template_Import_Siswa.xlsx');
}