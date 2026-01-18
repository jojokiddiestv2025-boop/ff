import React, { useMemo } from 'react';
import { GridData, AnalysisResult } from '../types';
import { getColLetter } from '../utils/formulaUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell as RechartsCell } from 'recharts';
import { X } from 'lucide-react';

interface DashboardProps {
  grid: GridData;
  analysis: AnalysisResult | null;
  onClose: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ grid, analysis, onClose }) => {
  
  // Auto-detect numeric columns for charting
  const chartData = useMemo(() => {
    const rows = 20; // limit for demo
    const cols = 10;
    const data: any[] = [];
    
    // We assume Row 1 is header
    const headers: string[] = [];
    for(let c=0; c<cols; c++) {
      const id = `${getColLetter(c)}1`;
      headers.push(String(grid[id]?.computedValue || `Col ${getColLetter(c)}`));
    }

    for(let r=1; r<rows; r++) { // Start from row 2 (index 1)
      const rowObj: any = { name: `Row ${r+1}` };
      let hasValue = false;
      for(let c=0; c<cols; c++) {
        const id = `${getColLetter(c)}${r+1}`;
        const val = grid[id]?.computedValue;
        if (typeof val === 'number') {
          rowObj[headers[c]] = val;
          hasValue = true;
        }
      }
      if (hasValue) data.push(rowObj);
    }
    return data;
  }, [grid]);

  // Find keys that are actually numeric in the data
  const dataKeys = useMemo(() => {
    if (chartData.length === 0) return [];
    const sample = chartData[0];
    return Object.keys(sample).filter(k => k !== 'name' && typeof sample[k] === 'number');
  }, [chartData]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="w-[400px] border-l border-gray-200 bg-white h-full flex flex-col shadow-xl z-30 shrink-0">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="font-semibold text-gray-700">Data Dashboard</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        
        {/* Analysis Section */}
        {analysis && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-sm">
            <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
               AI Analysis
            </h3>
            <p className="text-gray-700 mb-3">{analysis.summary}</p>
            <ul className="list-disc pl-4 space-y-1 text-gray-600">
              {analysis.insights.map((insight, i) => (
                <li key={i}>{insight}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Charts */}
        {dataKeys.length > 0 ? (
          <>
            <div className="h-64 bg-white border border-gray-100 rounded-lg p-2 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 text-center uppercase tracking-wide">Trend Analysis</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" hide />
                  <YAxis tick={{fontSize: 10}} width={30} />
                  <Tooltip contentStyle={{fontSize: '12px'}} />
                  {dataKeys.slice(0, 3).map((key, i) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-64 bg-white border border-gray-100 rounded-lg p-2 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 text-center uppercase tracking-wide">Category Comparison</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" hide />
                  <YAxis tick={{fontSize: 10}} width={30} />
                  <Tooltip contentStyle={{fontSize: '12px'}} cursor={{fill: '#f9fafb'}} />
                  {dataKeys.slice(0, 3).map((key, i) => (
                    <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            
             <div className="h-64 bg-white border border-gray-100 rounded-lg p-2 shadow-sm">
               <h3 className="text-xs font-semibold text-gray-500 mb-2 text-center uppercase tracking-wide">Distribution (First Column)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.slice(0, 10)} // Limit slices
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey={dataKeys[0]}
                  >
                    {chartData.slice(0, 10).map((entry, index) => (
                      <RechartsCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{fontSize: '12px'}} />
                </PieChart>
              </ResponsiveContainer>
             </div>
          </>
        ) : (
          <div className="text-center text-gray-400 py-10 text-sm">
            Enter numeric data in rows to see visualizations.
            <br />
            (e.g., A1: "Sales", A2: 100)
          </div>
        )}
      </div>
    </div>
  );
};