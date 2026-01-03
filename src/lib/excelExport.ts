import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  columns: ExcelColumn[];
  data: any[];
  title?: string;
  subtitle?: string;
}

export function exportToExcel(options: ExcelExportOptions) {
  const { filename, sheetName, columns, data, title, subtitle } = options;

  const wb = XLSX.utils.book_new();
  const ws: any = {};

  let currentRow = 0;

  if (title) {
    ws['A1'] = { t: 's', v: title };
    ws['!merges'] = ws['!merges'] || [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } });
    currentRow = 1;
  }

  if (subtitle) {
    const row = currentRow + 1;
    ws[`A${row}`] = { t: 's', v: subtitle };
    ws['!merges'] = ws['!merges'] || [];
    ws['!merges'].push({ s: { r: row - 1, c: 0 }, e: { r: row - 1, c: columns.length - 1 } });
    currentRow = row;
  }

  currentRow += 1;

  const headers = columns.map(col => col.header);
  const headerRow = currentRow + 1;
  headers.forEach((header, colIdx) => {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow - 1, c: colIdx });
    ws[cellAddress] = {
      t: 's',
      v: header,
      s: {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4472C4' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      },
    };
  });

  currentRow = headerRow;

  data.forEach((row, rowIdx) => {
    columns.forEach((col, colIdx) => {
      const cellAddress = XLSX.utils.encode_cell({ r: currentRow + rowIdx, c: colIdx });
      const value = row[col.key] ?? '';
      ws[cellAddress] = {
        t: typeof value === 'number' ? 'n' : 's',
        v: value,
        s: {
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
          alignment: { horizontal: 'left', vertical: 'center' },
        },
      };
    });
  });

  const colWidths = columns.map(col => ({ wch: col.width || 20 }));
  ws['!cols'] = colWidths;

  const range = {
    s: { r: 0, c: 0 },
    e: { r: currentRow + data.length - 1, c: columns.length - 1 },
  };
  ws['!ref'] = XLSX.utils.encode_range(range);

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
  const fullFilename = `${filename}_${timestamp}.xlsx`;
  XLSX.writeFile(wb, fullFilename);
}

export function exportStudentsToExcel(students: any[]) {
  exportToExcel({
    filename: 'Data_Siswa',
    sheetName: 'Siswa',
    title: 'DATA SISWA',
    subtitle: `Diekspor pada: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}`,
    columns: [
      { header: 'No', key: 'no', width: 5 },
      { header: 'NISN', key: 'nisn', width: 15 },
      { header: 'Nama Lengkap', key: 'nama', width: 30 },
      { header: 'Kelas', key: 'kelas', width: 10 },
      { header: 'Jenis Kelamin', key: 'jenis_kelamin', width: 15 },
      { header: 'Tempat Lahir', key: 'tempat_lahir', width: 20 },
      { header: 'Tanggal Lahir', key: 'tanggal_lahir', width: 15 },
      { header: 'Alamat', key: 'alamat', width: 35 },
      { header: 'No. Telepon', key: 'no_telepon', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
    ],
    data: students.map((s, idx) => ({
      no: idx + 1,
      nisn: s.nisn,
      nama: s.nama,
      kelas: s.kelas,
      jenis_kelamin: s.jenis_kelamin,
      tempat_lahir: s.tempat_lahir,
      tanggal_lahir: s.tanggal_lahir,
      alamat: s.alamat,
      no_telepon: s.no_telepon,
      email: s.email,
    })),
  });
}

export function exportSiswaToExcel(siswa: any[]) {
  exportToExcel({
    filename: 'Data_Siswa',
    sheetName: 'Siswa',
    title: 'DATA SISWA',
    subtitle: `Diekspor pada: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}`,
    columns: [
      { header: 'No', key: 'no', width: 5 },
      { header: 'NISN', key: 'nisn', width: 15 },
      { header: 'Nama Siswa', key: 'nama_siswa', width: 30 },
      { header: 'Kelas', key: 'kelas_nama', width: 10 },
      { header: 'Jenis Kelamin', key: 'jenis_kelamin', width: 15 },
      { header: 'Tempat Lahir', key: 'tempat_lahir', width: 20 },
      { header: 'Tanggal Lahir', key: 'tanggal_lahir', width: 15 },
      { header: 'Alamat', key: 'alamat', width: 35 },
      { header: 'Telepon Orang Tua', key: 'telepon_orang_tua', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Status', key: 'status', width: 10 },
    ],
    data: siswa.map((s, idx) => ({
      no: idx + 1,
      nisn: s.nisn,
      nama_siswa: s.nama_siswa,
      kelas_nama: s.kelas_nama,
      jenis_kelamin: s.jenis_kelamin,
      tempat_lahir: s.tempat_lahir || '',
      tanggal_lahir: s.tanggal_lahir || '',
      alamat: s.alamat || '',
      telepon_orang_tua: s.telepon_orang_tua || '',
      email: s.email || '',
      status: s.status || 'Aktif',
    })),
  });
}