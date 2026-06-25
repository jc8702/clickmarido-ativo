'use client';

import { 
  MessageCircle, 
  CircleDot, 
  MessagesSquare, 
  Users, 
  Megaphone, 
  Store, 
  Activity, 
  Plus,
  Settings,
  Image
} from 'lucide-react';

interface LeftIconBarProps {
  activeIcon?: string;
  onIconClick?: (icon: string) => void;
}

const icons = [
  { id: 'chats', icon: MessageCircle, label: 'Conversas', badge: 0 },
  { id: 'status', icon: CircleDot, label: 'Status', badge: 2 },
  { id: 'channels', icon: MessagesSquare, label: 'Canais', badge: 0 },
  { id: 'communities', icon: Users, label: 'Comunidades', badge: 0 },
  { id: 'new-chat', icon: Plus, label: 'Nova conversa', badge: 0, isAction: true },
  { id: 'orders', icon: Megaphone, label: 'Pedidos', badge: 0 },
  { id: 'catalog', icon: Store, label: 'Catálogo', badge: 0 },
  { id: 'insights', icon: Activity, label: 'Métricas', badge: 0 },
];

const bottomIcons = [
  { id: 'media', icon: Image, label: 'Mídia' },
  { id: 'settings', icon: Settings, label: 'Configurações' },
];

export default function LeftIconBar({ activeIcon = 'chats', onIconClick }: LeftIconBarProps) {
  return (
    <div className="w-[68px] bg-[#111b21] border-r border-[#222d34] flex flex-col items-center py-3 hidden md:flex">
      {/* Top Icons */}
      <div className="flex-1 flex flex-col items-center gap-1">
        {icons.map(({ id, icon: Icon, label, badge, isAction }) => (
          <button
            key={id}
            onClick={() => onIconClick?.(id)}
            title={label}
            className={`
              relative w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-200 group
              ${isAction 
                ? 'bg-[#00a884] hover:bg-[#06cf9c] text-white' 
                : activeIcon === id 
                  ? 'text-white' 
                  : 'text-[#aebac1] hover:text-white hover:bg-[#202c33]'
              }
            `}
          >
            <Icon className="w-5 h-5" strokeWidth={activeIcon === id ? 2.5 : 1.5} />
            
            {/* Active indicator */}
            {activeIcon === id && !isAction && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#00a884] rounded-r-full" />
            )}
            
            {/* Badge */}
            {badge > 0 && !isAction && (
              <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#00a884] rounded-full flex items-center justify-center text-[11px] font-medium text-white px-1">
                {badge}
              </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2 py-1 bg-[#1f2c34] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {label}
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col items-center gap-1 pt-2 border-t border-[#222d34]">
        {bottomIcons.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onIconClick?.(id)}
            title={label}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-200 group
              ${activeIcon === id 
                ? 'text-white' 
                : 'text-[#aebac1] hover:text-white hover:bg-[#202c33]'
              }
            `}
          >
            <Icon className="w-5 h-5" strokeWidth={activeIcon === id ? 2.5 : 1.5} />
            
            {activeIcon === id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#00a884] rounded-r-full" />
            )}
            
            <div className="absolute left-full ml-3 px-2 py-1 bg-[#1f2c34] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
