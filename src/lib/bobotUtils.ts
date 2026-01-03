import { supabase } from "@/supabase/client";
import type { JenisPenilaian } from "./indexedDB";

/**
 * Get bobot for a specific kelas. If custom bobot is set for the kelas,
 * use that. Otherwise, use the default bobot from jenis_penilaian.
 */
export const getBobotForKelas = async (
  kelasId: string,
  categories: JenisPenilaian[]
): Promise<{ [key: string]: number }> => {
  try {
    // Try to get custom bobot for this kelas from Supabase
    const { data, error } = await supabase
      .from("bobot_penilaian_kelas")
      .select("kategori_id, bobot")
      .eq("kelas_id", kelasId);

    if (error) throw error;

    if (data && data.length > 0) {
      // Return custom bobot
      const bobotMap: { [key: string]: number } = {};
      data.forEach((item) => {
        bobotMap[item.kategori_id] = item.bobot;
      });
      return bobotMap;
    }

    // Return default bobot from categories
    const defaultBobot: { [key: string]: number } = {};
    categories.forEach((cat) => {
      defaultBobot[cat.id] = cat.bobot || 0;
    });
    return defaultBobot;
  } catch (error) {
    console.error("Error getting bobot:", error);
    // Fallback to default bobot
    const defaultBobot: { [key: string]: number } = {};
    categories.forEach((cat) => {
      defaultBobot[cat.id] = cat.bobot || 0;
    });
    return defaultBobot;
  }
};

/**
 * Get bobot value for a specific category in a specific kelas
 */
export const getBobotForKategori = async (
  kelasId: string,
  kategoriId: string,
  categories: JenisPenilaian[]
): Promise<number> => {
  const bobotMap = await getBobotForKelas(kelasId, categories);
  return bobotMap[kategoriId] || 0;
};

/**
 * Save custom bobot for a kelas
 */
export const saveBobotForKelas = async (
  kelasId: string,
  bobotValues: { [key: string]: number }
): Promise<void> => {
  try {
    // Delete existing bobot for this kelas
    await supabase
      .from("bobot_penilaian_kelas")
      .delete()
      .eq("kelas_id", kelasId);

    // Insert new bobot values
    const insertData = Object.entries(bobotValues).map(([kategoriId, bobot]) => ({
      kelas_id: kelasId,
      kategori_id: kategoriId,
      bobot,
    }));

    const { error } = await supabase
      .from("bobot_penilaian_kelas")
      .insert(insertData);

    if (error) throw error;
  } catch (error) {
    console.error("Error saving bobot:", error);
    throw error;
  }
};
