import React from 'react';
import { Download, BarChart2, Bold, Italic, Type } from 'lucide-react';

interface ToolbarProps {
  onExport: () => void;
  onToggleDashboard: () => void;
  showDashboard: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onExport, 
  onToggleDashboard,
  showDashboard
}) => {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0 shadow-sm z-20">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mr-6 text-green-700 font-bold text-lg">
          <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white">
            <Type size={20} />
          </div>
          SmartSheet
        </div>

        <div className="h-6 w-px bg-gray-300 mx-2"></div>

        <button className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Bold">
          <Bold size={18} />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Italic">
          <Italic size={18} />
        </button>
        
        <div className="h-6 w-px bg-gray-300 mx-2"></div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleDashboard}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showDashboard ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          <BarChart2 size={16} />
          Dashboard
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
        >
          <Download size={16} />
          Export XLSX
        </button>
      </div>
    </div>
  );
};