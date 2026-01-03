import { supabase } from "@/supabase/client";

export interface GradeThreshold {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
}

const DEFAULT_GRADE_THRESHOLDS: GradeThreshold = {
  A: 85,
  B: 70,
  C: 55,
  D: 40,
  E: 0,
};

/**
 * Get grade thresholds from Supabase
 */
export const getGradeThresholds = async (): Promise<GradeThreshold> => {
  try {
    const { data, error } = await supabase
      .from("grade_thresholds")
      .select("grade, threshold");

    if (error) throw error;

    if (!data || data.length === 0) {
      return DEFAULT_GRADE_THRESHOLDS;
    }

    const thresholds: any = {};
    data.forEach((item) => {
      thresholds[item.grade] = item.threshold;
    });

    return thresholds as GradeThreshold;
  } catch (error) {
    console.error("Error loading grade thresholds:", error);
    return DEFAULT_GRADE_THRESHOLDS;
  }
};

/**
 * Save grade thresholds to Supabase
 */
export const saveGradeThresholds = async (thresholds: GradeThreshold): Promise<void> => {
  try {
    const updates = Object.entries(thresholds).map(([grade, threshold]) => ({
      grade,
      threshold,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from("grade_thresholds")
        .update({ threshold: update.threshold })
        .eq("grade", update.grade);

      if (error) throw error;
    }
  } catch (error) {
    console.error("Error saving grade thresholds:", error);
    throw error;
  }
};

/**
 * Convert numeric score to letter grade
 * Uses >= logic: A >= 85, B >= 70, C >= 55, D >= 40, E < 40
 */
export const getLetterGrade = (score: number, thresholds: GradeThreshold): string => {
  if (score >= thresholds.A) return "A";
  if (score >= thresholds.B) return "B";
  if (score >= thresholds.C) return "C";
  if (score >= thresholds.D) return "D";
  return "E";
};

/**
 * Get grade range description for display
 */
export const getGradeRange = (grade: keyof GradeThreshold, thresholds: GradeThreshold): string => {
  const grades = ['A', 'B', 'C', 'D', 'E'] as const;
  const currentIndex = grades.indexOf(grade);
  const currentThreshold = thresholds[grade];
  
  if (currentIndex === 0) {
    // Grade A
    return `≥ ${currentThreshold}`;
  } else if (currentIndex === grades.length - 1) {
    // Grade E
    const previousGrade = grades[currentIndex - 1];
    const previousThreshold = thresholds[previousGrade];
    return `< ${previousThreshold}`;
  } else {
    // Grades B, C, D
    const previousGrade = grades[currentIndex - 1];
    const previousThreshold = thresholds[previousGrade];
    return `${currentThreshold} - ${previousThreshold - 0.01}`;
  }
};

/**
 * Validate grade thresholds
 */
export const validateGradeThresholds = (thresholds: GradeThreshold): { valid: boolean; error?: string } => {
  // Check if thresholds are in descending order
  if (thresholds.A <= thresholds.B) {
    return { valid: false, error: "Threshold A harus lebih besar dari B" };
  }
  if (thresholds.B <= thresholds.C) {
    return { valid: false, error: "Threshold B harus lebih besar dari C" };
  }
  if (thresholds.C <= thresholds.D) {
    return { valid: false, error: "Threshold C harus lebih besar dari D" };
  }
  if (thresholds.D <= thresholds.E) {
    return { valid: false, error: "Threshold D harus lebih besar dari E" };
  }
  
  // Check if all values are within 0-100
  const values = Object.values(thresholds);
  if (values.some(v => v < 0 || v > 100)) {
    return { valid: false, error: "Semua threshold harus antara 0-100" };
  }
  
  // E should always be 0
  if (thresholds.E !== 0) {
    return { valid: false, error: "Threshold E harus 0" };
  }
  
  return { valid: true };
};
