'use client';

import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export type FilterType = 'all' | 'unread' | 'favorites' | 'groups' | 'labels';

interface FilterPillsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const filters: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'Tudo' },
  { id: 'unread', label: 'Não lidas' },
  { id: 'favorites', label: 'Favoritas' },
  { id: 'groups', label: 'Grupos' },
];

export default function FilterPills({ activeFilter, onFilterChange }: FilterPillsProps) {
  const [showLabels, setShowLabels] = useState(false);
  const labelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (labelsRef.current && !labelsRef.current.contains(event.target as Node)) {
        setShowLabels(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="px-3 py-2 border-b border-gray-200 dark:border-[#222d34] bg-gray-50 dark:bg-[#111b21]">
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onFilterChange(id)}
            className={`
              px-3 py-1.5 rounded-full text-[13px] font-medium transition-all
              ${activeFilter === id 
                ? 'bg-[#00a884] text-white' 
                : 'bg-gray-200 dark:bg-[#202c33] text-gray-600 dark:text-[#8696a0] hover:bg-gray-300 dark:hover:bg-[#2a3942] hover:text-black dark:hover:text-[#e9edef]'
              }
            `}
          >
            {label}
          </button>
        ))}
        
        {/* Labels dropdown */}
        <div className="relative" ref={labelsRef}>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`
              px-3 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-1
              ${activeFilter === 'labels' 
                ? 'bg-[#00a884] text-white' 
                : 'bg-gray-200 dark:bg-[#202c33] text-gray-600 dark:text-[#8696a0] hover:bg-gray-300 dark:hover:bg-[#2a3942] hover:text-black dark:hover:text-[#e9edef]'
              }
            `}
          >
            Etiquetas
            <ChevronDown className="w-3 h-3" />
          </button>
          
          {showLabels && (
            <div className="absolute top-full left-0 mt-1 w-[180px] bg-white dark:bg-[#233138] rounded-md shadow-lg py-2 z-50">
              <button 
                onClick={() => { onFilterChange('labels'); setShowLabels(false); }}
                className="w-full text-left px-4 py-2 text-black dark:text-[#e9edef] text-sm hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors"
              >
                Todas as etiquetas
              </button>
              <div className="border-t border-gray-200 dark:border-[#222d34] my-1" />
              <button className="w-full text-left px-4 py-2 text-black dark:text-[#e9edef] text-sm hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00a884]" />
                Cliente
              </button>
              <button className="w-full text-left px-4 py-2 text-black dark:text-[#e9edef] text-sm hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff9500]" />
                Lead
              </button>
              <button className="w-full text-left px-4 py-2 text-black dark:text-[#e9edef] text-sm hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff3b30]" />
                Urgente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
