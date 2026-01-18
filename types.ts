export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  color?: string;
  backgroundColor?: string;
}

export interface CellData {
  rawValue: string; // The user input (e.g., "100" or "=A1+B1")
  computedValue: string | number | null; // The calculated result
  style?: CellStyle;
}

export type GridData = Record<string, CellData>;

export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}
