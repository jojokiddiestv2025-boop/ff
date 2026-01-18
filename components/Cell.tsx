import React, { useState, useEffect, useRef } from 'react';
import { CellData } from '../types';
import clsx from 'clsx';

interface CellProps {
  id: string;
  data?: CellData;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, value: string) => void;
}

export const Cell: React.FC<CellProps> = ({ id, data, isSelected, onSelect, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data?.rawValue || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal state if external data changes (e.g. from formula update or initial load)
  useEffect(() => {
    setEditValue(data?.rawValue || '');
  }, [data?.rawValue]);

  useEffect(() => {
    if (isSelected && isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected, isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleClick = () => {
    onSelect(id);
    if (isSelected) {
        // If already selected, maybe just wait for double click, 
        // but simple click doesn't enter edit mode typically in Excel until typing.
        // For web simplicity, we'll keep double click for edit.
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      onChange(id, editValue);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(id, editValue);
  };

  const displayValue = isEditing ? editValue : (data?.computedValue ?? '');

  return (
    <div
      className={clsx(
        "relative min-w-[100px] h-[30px] border-r border-b border-gray-200 text-sm flex items-center px-1 overflow-hidden select-none",
        isSelected ? "ring-2 ring-green-500 z-10 bg-green-50" : "bg-white hover:bg-gray-50",
        data?.style?.bold && "font-bold",
        data?.style?.italic && "italic"
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        color: data?.style?.color,
        backgroundColor: isSelected ? undefined : data?.style?.backgroundColor
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="w-full h-full outline-none bg-transparent"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      ) : (
        <span className="truncate w-full block cursor-default">
            {displayValue}
        </span>
      )}
    </div>
  );
};
