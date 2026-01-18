import { GridData, CellData } from '../types';

// Helper to get column letter from index (0 -> A, 1 -> B)
export const getColLetter = (colIndex: number): string => {
  let letter = '';
  while (colIndex >= 0) {
    letter = String.fromCharCode((colIndex % 26) + 65) + letter;
    colIndex = Math.floor(colIndex / 26) - 1;
  }
  return letter;
};

// Helper to get cell ID (0, 0 -> A1)
export const getCellId = (rowIndex: number, colIndex: number): string => {
  return `${getColLetter(colIndex)}${rowIndex + 1}`;
};

// Basic formula evaluator
const evaluateExpression = (expression: string): number | string => {
  try {
    // Safety: Remove anything that isn't a digit, operator, or parenthesis
    // This is a very basic sanitizer for a demo. In prod, use a math parser library.
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    // eslint-disable-next-line no-new-func
    return new Function(`return ${sanitized}`)();
  } catch (e) {
    return "#ERROR";
  }
};

const resolveReference = (ref: string, grid: GridData, visited: Set<string>): number => {
  if (visited.has(ref)) throw new Error("Cycle detected");
  
  const cell = grid[ref];
  if (!cell) return 0;

  // If the referenced cell is also a formula, we might need a more complex recursive resolver
  // taking into account the already computed values. 
  // For this 'simple' version, we assume referenced cells are numbers or simple calcs.
  // Ideally, we'd use a dependency graph.
  
  const val = parseFloat(cell.computedValue as string);
  return isNaN(val) ? 0 : val;
};

// Range parser: A1:A3 -> [A1, A2, A3]
const expandRange = (range: string): string[] => {
  const [start, end] = range.split(':');
  if (!start || !end) return [];

  const startColMatch = start.match(/[A-Z]+/);
  const startRowMatch = start.match(/[0-9]+/);
  const endColMatch = end.match(/[A-Z]+/);
  const endRowMatch = end.match(/[0-9]+/);

  if (!startColMatch || !startRowMatch || !endColMatch || !endRowMatch) return [];

  // This is a simplified range expander (single column or single row only for demo)
  // Implementing full 2D range expansion is complex without a library.
  // We will support simple vertical vertical ranges for SUM(A1:A5)
  
  const startRow = parseInt(startRowMatch[0]);
  const endRow = parseInt(endRowMatch[0]);
  const colChar = startColMatch[0]; // Assume same column for simplicity in this demo

  const cells = [];
  for (let i = startRow; i <= endRow; i++) {
    cells.push(`${colChar}${i}`);
  }
  return cells;
};

export const computeValue = (
  cellId: string, 
  rawValue: string, 
  grid: GridData, 
  visited: Set<string> = new Set()
): string | number => {
  if (!rawValue.startsWith('=')) {
    const num = parseFloat(rawValue);
    return isNaN(num) ? rawValue : num;
  }

  // Handle Formula
  visited.add(cellId);
  let formula = rawValue.substring(1).toUpperCase(); // Remove '='

  try {
    // 1. Handle Ranges (e.g., SUM(A1:A3))
    // We'll replace SUM(A1:A3) with (A1+A2+A3) strictly for this demo parser
    // This is a naive implementation.
    const sumMatch = formula.match(/SUM\(([A-Z0-9:]+)\)/);
    if (sumMatch) {
      const range = sumMatch[1];
      const cellIds = expandRange(range);
      const replacement = `(${cellIds.join('+')})`;
      formula = formula.replace(sumMatch[0], replacement);
    }
    
    const avgMatch = formula.match(/AVERAGE\(([A-Z0-9:]+)\)/);
    if (avgMatch) {
      const range = avgMatch[1];
      const cellIds = expandRange(range);
      const replacement = `((${cellIds.join('+')})/${cellIds.length})`;
      formula = formula.replace(avgMatch[0], replacement);
    }

    // 2. Replace Cell References with Values
    // Regex to find cell IDs like A1, Z99 (not inside quotes)
    formula = formula.replace(/[A-Z]+[0-9]+/g, (match) => {
       // Check cycle
       if (visited.has(match)) return '0'; // Break cycle with 0
       
       // Get value recursively (if we had a true DAG evaluator)
       // Here we peek at the 'computedValue' if it exists in the CURRENT grid state
       // or we might need to compute it on the fly.
       // The simpliest react approach: use previous render's computed value or re-calc entire sheet in topological order.
       // We'll trust the grid's current computedValue for simplicity, or 0.
       const refCell = grid[match];
       const val = refCell?.computedValue;
       return val ? String(val) : '0';
    });

    return evaluateExpression(formula);

  } catch (err) {
    return "#ERR";
  }
};

export const recalculateGrid = (grid: GridData): GridData => {
  // A real implementation would use topological sort.
  // We will do a double-pass to catch immediate dependencies.
  
  const newGrid = { ...grid };
  const cellIds = Object.keys(newGrid);

  // Pass 1
  cellIds.forEach(id => {
    newGrid[id] = {
      ...newGrid[id],
      computedValue: computeValue(id, newGrid[id].rawValue, grid)
    };
  });

  // Pass 2 (resolve simple 1-level forward deps)
  cellIds.forEach(id => {
     newGrid[id] = {
      ...newGrid[id],
      computedValue: computeValue(id, newGrid[id].rawValue, newGrid) // Use updated values from Pass 1
    };
  });

  return newGrid;
};
