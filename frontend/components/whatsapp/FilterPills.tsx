'use client';

import { Tag } from 'lucide-react';
import { WhatsAppLabel } from './hooks/useWhatsAppApi';

export type FilterType = 'all' | 'unread' | 'groups' | 'favorites' | 'archived' | 'labels';

interface FilterPillsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  selectedLabelId?: string | null;
  onSelectLabel?: (labelId: string | null) => void;
  labels?: WhatsAppLabel[];
}

const filters: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'Tudo' },
  { id: 'unread', label: 'Não lidas' },
  { id: 'groups', label: 'Grupos' },
  { id: 'favorites', label: 'Favoritos' },
  { id: 'labels', label: 'Etiquetas' },
];

export default function FilterPills({ 
  activeFilter, 
  onFilterChange, 
  selectedLabelId,
  onSelectLabel,
  labels = [],
}: FilterPillsProps) {
  return (
    <div className="px-3 py-2 border-b border-gray-200 dark:border-[#222d34] bg-gray-50 dark:bg-[#111b21]">
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => {
              onFilterChange(id);
              if (id !== 'labels' && onSelectLabel) {
                onSelectLabel(null);
              }
            }}
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
      </div>
      
      {/* Lista de etiquetas quando ativo */}
      {activeFilter === 'labels' && labels.length > 0 && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {labels.map((label) => (
            <button
              key={label.id}
              onClick={() => onSelectLabel?.(selectedLabelId === label.id ? null : label.id)}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium transition-all
                ${selectedLabelId === label.id
                  ? 'text-white'
                  : 'bg-gray-200 dark:bg-[#202c33] text-gray-600 dark:text-[#8696a0] hover:bg-gray-300 dark:hover:bg-[#2a3942]'
                }
              `}
              style={selectedLabelId === label.id ? { backgroundColor: label.color } : {}}
            >
              <Tag className="w-3 h-3" />
              {label.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
