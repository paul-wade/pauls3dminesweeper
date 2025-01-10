import React from 'react';

interface CellProps {
  value: number;
  revealed: boolean;
  flagged: boolean;
  hasMine: boolean;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
}

const Cell: React.FC<CellProps> = ({
  value,
  revealed,
  flagged,
  hasMine,
  onClick,
  onRightClick,
}) => {
  const getCellContent = () => {
    if (!revealed && flagged) return '⚑';
    if (!revealed) return '';
    if (hasMine) return '●';
    return value > 0 ? value : '';
  };

  const getNumberColor = () => {
    const colors = [
      '',
      'text-blue-700',    // 1
      'text-green-700',   // 2
      'text-red-700',     // 3
      'text-blue-900',    // 4
      'text-red-900',     // 5
      'text-cyan-800',    // 6
      'text-black',       // 7
      'text-gray-600',    // 8
    ];
    return colors[value] || '';
  };

  return (
    <button
      className={`w-7 h-7 flex items-center justify-center select-none ${
        revealed 
          ? 'bg-[#c0c0c0] border border-[#7b7b7b] shadow-[inset_1px_1px_2px_rgba(128,128,128,0.5)] cursor-default' 
          : 'bg-[#c0c0c0] hover:bg-[#d0d0d0] border-[3px] border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] cursor-pointer active:border-[1px] active:border-[#7b7b7b]'
      } ${hasMine && revealed ? 'bg-red-500' : ''} ${
        value > 0 && revealed ? getNumberColor() : ''
      }`}
      onClick={revealed ? undefined : onClick}
      onContextMenu={revealed ? undefined : onRightClick}
      style={{ 
        fontFamily: '"Courier New", monospace',
        fontSize: '16px',
        fontWeight: 'bold',
        lineHeight: '16px'
      }}
    >
      {getCellContent()}
    </button>
  );
};

export default Cell;
