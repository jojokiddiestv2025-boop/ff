import { GoogleGenAI } from "@google/genai";
import { GridData, AnalysisResult } from "../types";
import { getColLetter } from "../utils/formulaUtils";

// Helper to convert grid to CSV string for AI
const gridToCSV = (grid: GridData, maxRows = 20, maxCols = 10): string => {
  let csv = "";
  // Header
  for (let c = 0; c < maxCols; c++) {
    csv += getColLetter(c) + (c < maxCols - 1 ? "," : "");
  }
  csv += "\n";

  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < maxCols; c++) {
      const id = `${getColLetter(c)}${r + 1}`;
      const val = grid[id]?.computedValue || "";
      csv += val + (c < maxCols - 1 ? "," : "");
    }
    csv += "\n";
  }
  return csv;
};

export const analyzeData = async (grid: GridData): Promise<AnalysisResult> => {
  try {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) throw new Error("No API Key found");

    const ai = new GoogleGenAI({ apiKey });
    const csvData = gridToCSV(grid);

    const prompt = `
      You are a data analyst. Analyze the following CSV data from a spreadsheet.
      
      CSV Data:
      ${csvData}

      Provide a brief summary of what this data represents and 3 key insights or trends.
      Return the response in JSON format with keys: "summary" (string) and "insights" (array of strings).
      Do not include markdown code blocks. Just the raw JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "Could not analyze data at this time. Please check your API key.",
      insights: ["Ensure your data is numeric and structured correctly."]
    };
  }
};

export const suggestFormula = async (
  description: string, 
  grid: GridData,
  targetCell: string
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) return "";

    const ai = new GoogleGenAI({ apiKey });
    
    // Provide header context (Row 1)
    let headers = [];
    for(let i=0; i<10; i++) {
        const id = `${getColLetter(i)}1`;
        headers.push(`${getColLetter(i)}: ${grid[id]?.computedValue || ''}`);
    }

    const prompt = `
      You are an Excel expert. The user wants a formula for cell ${targetCell}.
      
      Context (Column Headers):
      ${headers.join(', ')}

      User Request: "${description}"
      
      Return ONLY the formula starting with '='.
      Example Output: =SUM(A1:A5)
      Do not return markdown or explanation.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    let formula = response.text?.trim() || "";
    // Sanitize
    if (!formula.startsWith('=')) formula = '=' + formula;
    // Remove markdown code blocks if present
    formula = formula.replace(/```/g, '').replace(/plaintext/g, '').trim();
    
    return formula;

  } catch (error) {
    console.error("Formula Gen Error", error);
    return "";
  }
}