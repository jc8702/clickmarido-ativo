'use client';

import { MessageCircle, Plus, Tag } from 'lucide-react';

interface LeftIconBarProps {
  activeIcon?: string;
  onIconClick?: (icon: string) => void;
}

/** Apenas ícones com funcionalidade real */
const icons = [
  { id: 'chats', icon: MessageCircle, label: 'Conversas' },
  { id: 'labels', icon: Tag, label: 'Etiquetas' },
];

const bottomIcons = [
  { id: 'new-chat', icon: Plus, label: 'Nova conversa', isAction: true },
];

export default function LeftIconBar({ activeIcon = 'chats', onIconClick }: LeftIconBarProps) {
  return (
    <div className="w-[68px] bg-gray-50 dark:bg-[#111b21] border-r border-gray-200 dark:border-[#222d34] flex flex-col items-center py-3 hidden md:flex">
      {/* Top Icons */}
      <div className="flex-1 flex flex-col items-center gap-1">
        {icons.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onIconClick?.(id)}
            title={label}
            className={`
              relative w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-200 group
              ${activeIcon === id 
                ? 'text-black dark:text-white' 
                : 'text-gray-600 dark:text-[#aebac1] hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202c33]'
              }
            `}
          >
            <Icon className="w-5 h-5" strokeWidth={activeIcon === id ? 2.5 : 1.5} />
            
            {/* Active indicator */}
            {activeIcon === id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#00a884] rounded-r-full" />
            )}
            
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2 py-1 bg-gray-700 dark:bg-[#1f2c34] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {label}
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col items-center gap-1 pt-2 border-t border-gray-200 dark:border-[#222d34]">
        {bottomIcons.map(({ id, icon: Icon, label, isAction }) => (
          <button
            key={id}
            onClick={() => onIconClick?.(id)}
            title={label}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-200 group
              ${isAction 
                ? 'bg-[#00a884] hover:bg-[#06cf9c] text-white' 
                : 'text-gray-600 dark:text-[#aebac1] hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202c33]'
              }
            `}
          >
            <Icon className="w-5 h-5" />
            
            <div className="absolute left-full ml-3 px-2 py-1 bg-gray-700 dark:bg-[#1f2c34] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
