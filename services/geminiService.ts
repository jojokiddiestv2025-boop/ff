import { GridData } from "../types";

// AI features removed for Vercel compatibility
export const analyzeData = async (grid: GridData): Promise<any> => {
  return { summary: "", insights: [] };
};

export const suggestFormula = async (
  description: string, 
  grid: GridData,
  targetCell: string
): Promise<string> => {
  return "";
}