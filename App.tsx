import React, { useState, useEffect, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { Cell } from './components/Cell';
import { Dashboard } from './components/Dashboard';
import { FormulaGenerator } from './components/FormulaGenerator';
import { GridData, AnalysisResult } from './types';
import { recalculateGrid, getColLetter, getCellId } from './utils/formulaUtils';
import { analyzeData, suggestFormula } from './services/geminiService';
import { Sparkles, Calculator } from 'lucide-react';
import * as XLSX from 'xlsx';

// Constants for grid size
const ROWS = 50;
const COLS = 15;

const App: React.FC = () => {
  const [grid, setGrid] = useState<GridData>({});
  const [selectedCell, setSelectedCell] = useState<string | null>('A1');
  const [showDashboard, setShowDashboard] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFormulaWizard, setShowFormulaWizard] = useState(false);

  // Initialize with Basic Salary Template
  useEffect(() => {
    // Basic, neutral styles
    const headerStyle = { bold: true, backgroundColor: '#f3f4f6', color: '#1f2937' }; 
    const totalStyle = { bold: true, backgroundColor: '#e5e7eb' }; 

    const initialGrid: GridData = {
      // Headers
      'A1': { rawValue: 'Staff Name', computedValue: 'Staff Name', style: headerStyle },
      'B1': { rawValue: 'Role', computedValue: 'Role', style: headerStyle },
      'C1': { rawValue: 'Annual Salary', computedValue: 'Annual Salary', style: headerStyle },
      'D1': { rawValue: 'Tax Rate', computedValue: 'Tax Rate', style: headerStyle },
      'E1': { rawValue: 'Monthly Net', computedValue: 'Monthly Net', style: headerStyle },

      // Row 2 (Empty Slot 1)
      'A2': { rawValue: '', computedValue: '' },
      'B2': { rawValue: '', computedValue: '' },
      'C2': { rawValue: '0', computedValue: 0 },
      'D2': { rawValue: '0.20', computedValue: 0.20 }, // Default 20%
      'E2': { rawValue: '=(C2/12)*(1-D2)', computedValue: 0 }, // Simplified Formula: (Annual/12) * (1 - Tax)

      // Row 3 (Empty Slot 2)
      'A3': { rawValue: '', computedValue: '' },
      'B3': { rawValue: '', computedValue: '' },
      'C3': { rawValue: '0', computedValue: 0 },
      'D3': { rawValue: '0.20', computedValue: 0.20 },
      'E3': { rawValue: '=(C3/12)*(1-D3)', computedValue: 0 },

      // Row 4 (Empty Slot 3)
      'A4': { rawValue: '', computedValue: '' },
      'B4': { rawValue: '', computedValue: '' },
      'C4': { rawValue: '0', computedValue: 0 },
      'D4': { rawValue: '0.20', computedValue: 0.20 },
      'E4': { rawValue: '=(C4/12)*(1-D4)', computedValue: 0 },

      // Row 5: Totals
      'A5': { rawValue: 'TOTAL', computedValue: 'TOTAL', style: totalStyle },
      'E5': { rawValue: '=SUM(E2:E4)', computedValue: 0, style: totalStyle },
    };
    
    setGrid(recalculateGrid(initialGrid));
  }, []);

  const handleCellChange = useCallback((id: string, value: string) => {
    setGrid(prev => {
      const nextGrid = {
        ...prev,
        [id]: { ...prev[id], rawValue: value }
      };
      return recalculateGrid(nextGrid);
    });
  }, []);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const data: any[][] = [];

    for (let r = 0; r < ROWS; r++) {
      const row: any[] = [];
      for (let c = 0; c < COLS; c++) {
        const id = getCellId(r, c);
        row.push(grid[id]?.computedValue ?? '');
      }
      data.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "salary_sheet.xlsx");
  };

  const handleAnalyze = async () => {
    if (!showDashboard) setShowDashboard(true);
    setIsAnalyzing(true);
    const result = await analyzeData(grid);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleGenerateFormula = async (prompt: string) => {
    if (!selectedCell) return;
    
    const formula = await suggestFormula(prompt, grid, selectedCell);
    if (formula) {
      handleCellChange(selectedCell, formula);
    }
  };

  const handleAutoSum = () => {
    if (!selectedCell) return;
    
    // Naive AutoSum: Sums the 5 cells above the current one
    const match = selectedCell.match(/([A-Z]+)([0-9]+)/);
    if (!match) return;
    
    const col = match[1];
    const row = parseInt(match[2]);
    
    if (row <= 1) return;
    
    // Look back up to 5 rows or until row 2
    const startRow = Math.max(2, row - 5);
    const endRow = row - 1;
    
    if (startRow > endRow) return;

    const formula = `=SUM(${col}${startRow}:${col}${endRow})`;
    handleCellChange(selectedCell, formula);
  };

  return (
    <div className="h-screen flex flex-col bg-white font-sans text-gray-800">
      <Toolbar 
        onExport={handleExport} 
        onAnalyze={handleAnalyze} 
        onToggleDashboard={() => setShowDashboard(!showDashboard)}
        showDashboard={showDashboard}
        analyzing={isAnalyzing}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Grid Area */}
        <div className="flex-1 overflow-auto flex flex-col relative">
           
           {/* Formula Bar & Tools */}
           <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 shadow-sm z-20">
             <div className="text-gray-400 font-mono text-xs w-8 text-center bg-gray-50 rounded border border-gray-200 py-1">
                {selectedCell}
             </div>
             
             <div className="h-6 w-px bg-gray-300 mx-1"></div>
             
             {/* Magic AI Button */}
             <button 
               onClick={() => setShowFormulaWizard(true)}
               className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold transition-all"
               title="Generate formula with AI"
             >
               <Sparkles size={14} />
               Ask AI
             </button>

             {/* AutoSum Button */}
             <button
               onClick={handleAutoSum}
               className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-100 text-gray-700 rounded text-xs font-medium border border-transparent hover:border-gray-200 transition-all"
               title="Auto Sum cells above"
             >
               <Calculator size={14} />
               AutoSum
             </button>

             <div className="h-6 w-px bg-gray-300 mx-1"></div>

             <div className="flex-1 relative">
                <input 
                  className="w-full text-sm font-mono text-gray-700 outline-none bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:border-blue-400 focus:bg-white transition-colors"
                  value={grid[selectedCell || '']?.rawValue || ''}
                  onChange={(e) => selectedCell && handleCellChange(selectedCell, e.target.value)}
                  placeholder="Type a value..."
                />
             </div>
           </div>

          {/* Scrollable Grid Container */}
          <div className="flex-1 overflow-auto relative bg-gray-100 p-4">
            <div className="bg-white shadow-sm inline-block rounded-sm overflow-hidden border border-gray-300">
              {/* Header Row */}
              <div className="flex sticky top-0 z-20 shadow-sm">
                 {/* Corner Spacer */}
                <div className="w-[40px] h-[30px] bg-gray-100 border-r border-b border-gray-300 shrink-0 sticky left-0 z-30"></div>
                {Array.from({ length: COLS }).map((_, colIndex) => (
                  <div key={colIndex} className="min-w-[100px] h-[30px] bg-gray-100 border-r border-b border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600 select-none">
                    {getColLetter(colIndex)}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {Array.from({ length: ROWS }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex group">
                  {/* Row Number (sticky left) */}
                  <div className="w-[40px] h-[30px] bg-gray-50 border-r border-b border-gray-300 flex items-center justify-center text-xs text-gray-500 shrink-0 sticky left-0 z-10 group-hover:bg-gray-100 select-none">
                    {rowIndex + 1}
                  </div>
                  
                  {/* Cells */}
                  {Array.from({ length: COLS }).map((_, colIndex) => {
                    const id = getCellId(rowIndex, colIndex);
                    return (
                      <Cell
                        key={id}
                        id={id}
                        data={grid[id]}
                        isSelected={selectedCell === id}
                        onSelect={setSelectedCell}
                        onChange={handleCellChange}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dashboard Side Panel */}
        {showDashboard && (
          <Dashboard 
            grid={grid} 
            analysis={analysis} 
            onClose={() => setShowDashboard(false)} 
          />
        )}

        {/* AI Formula Wizard Modal */}
        {showFormulaWizard && selectedCell && (
          <FormulaGenerator 
            targetCell={selectedCell}
            onClose={() => setShowFormulaWizard(false)}
            onGenerate={handleGenerateFormula}
          />
        )}
      </div>
    </div>
  );
};

export default App;