import { indexedDB } from './indexedDB';
import { supabase } from '@/lib/supabase';

export async function getActiveTahunAjaran(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('tahun_ajaran')
      .select('nama_tahun_ajaran')
      .eq('status', 'Aktif')
      .single();
    
    if (error || !data) {
      return '2025/2026';
    }
    
    return data.nama_tahun_ajaran;
  } catch {
    return '2025/2026';
  }
}

export async function getActiveSemester(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('tahun_ajaran')
      .select('semester')
      .eq('status', 'Aktif')
      .single();
    
    if (error || !data) {
      return 1;
    }
    
    return Number(data.semester);
  } catch {
    return 1;
  }
}

export async function setActiveTahunAjaran(tahunAjaran: string): Promise<void> {
  await supabase
    .from('tahun_ajaran')
    .update({ status: 'Tidak Aktif' })
    .neq('nama_tahun_ajaran', tahunAjaran);
  
  await supabase
    .from('tahun_ajaran')
    .update({ status: 'Aktif' })
    .eq('nama_tahun_ajaran', tahunAjaran);
}

export async function setActiveSemester(semester: number | string): Promise<void> {
  const activeYear = await getActiveTahunAjaran();
  
  await supabase
    .from('tahun_ajaran')
    .update({ semester: Number(semester) })
    .eq('nama_tahun_ajaran', activeYear)
    .eq('status', 'Aktif');
}

export async function getAllTahunAjaran(): Promise<string[]> {
  const { data, error } = await supabase
    .from('tahun_ajaran')
    .select('nama_tahun_ajaran')
    .order('tahun_mulai', { ascending: false });
  
  if (error || !data) return [];
  
  return data.map((t: any) => t.nama_tahun_ajaran);
}

export function generateUpcomingYears(lastYear: string, count: number = 3): string[] {
  if (!lastYear) return [];
  
  const [startYear] = lastYear.split('/').map(Number);
  const upcomingYears: string[] = [];
  
  for (let i = 1; i <= count; i++) {
    const year = startYear + i;
    upcomingYears.push(`${year}/${year + 1}`);
  }
  
  return upcomingYears;
}

export async function getAllTahunAjaranWithUpcoming(upcomingCount: number = 3): Promise<string[]> {
  const existingYears = await getAllTahunAjaran();
  
  if (existingYears.length === 0) {
    // If no years exist, start from current year
    const currentYear = new Date().getFullYear();
    return [`${currentYear}/${currentYear + 1}`];
  }
  
  // Get the latest year (first in reversed array)
  const latestYear = existingYears[0];
  const upcomingYears = generateUpcomingYears(latestYear, upcomingCount);
  
  // Combine existing and upcoming years, remove duplicates, sort ascending
  const allYears = [...existingYears, ...upcomingYears];
  return [...new Set(allYears)].sort();
}