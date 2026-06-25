'use client';

import { Filter, Plus, MoreVertical, Search, Menu, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Conversation } from './WhatsAppContainer';

interface WhatsAppSidebarProps {
  conversations: Conversation[];
  selectedConvId: string | null;
  onSelectConv: (id: string) => void;
  open: boolean;
  onToggle: () => void;
  connected?: boolean;
  qrCode?: string | null;
  crmCustomers?: any[];
  apiFetch?: any;
}

export default function WhatsAppSidebar({
  conversations,
  selectedConvId,
  onSelectConv,
  open,
  onToggle,
  connected = true,
  qrCode = null,
  crmCustomers = [],
  apiFetch
}: WhatsAppSidebarProps) {
  const [activeTab, setActiveTab] = useState<'conversations' | 'contacts'>('conversations');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar conversas
  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    return conversations.filter(c => 
      c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactNumber.includes(searchTerm)
    );
  }, [conversations, searchTerm]);

  // Filtrar contatos
  const filteredContacts = useMemo(() => {
    if (!searchTerm) return crmCustomers;
    return crmCustomers.filter(c => 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
    );
  }, [crmCustomers, searchTerm]);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-full md:w-80 lg:w-[400px] bg-whatsapp-dark border-r border-whatsapp-border
        flex flex-col fixed md:relative inset-0 z-40 md:z-auto
        transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Header com Close button (mobile) */}
        <div className="h-16 px-4 bg-whatsapp-card flex items-center justify-between border-b border-whatsapp-border">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white overflow-hidden">
                {/* User Avatar Placeholder */}
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
             </div>
             <h2 className="text-white font-bold text-lg hidden md:block">Click Marido Web</h2>
          </div>
          <div className="flex gap-4 text-gray-400">
             <div className="relative group">
                <div className={`w-3 h-3 rounded-full mt-1.5 ${connected ? 'bg-whatsapp-green' : 'bg-red-500'}`} />
                <div className="absolute top-6 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded hidden group-hover:block whitespace-nowrap z-50">
                   {connected ? 'Conectado à Evolution API' : 'Desconectado'}
                </div>
             </div>
             <MoreVertical className="w-6 h-6 cursor-pointer" />
             <button onClick={onToggle} className="md:hidden">
               <X className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Status de Conexão - Mostrar QR Code se desconectado */}
        {!connected && qrCode && (
           <div className="bg-[#222e35] p-6 flex flex-col items-center justify-center border-b border-whatsapp-border flex-shrink-0 z-50">
              <h3 className="text-white font-medium mb-4 text-center">Conecte o seu WhatsApp</h3>
              <div className="bg-white p-2 rounded-lg mb-4">
                 <img src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} alt="WhatsApp QR Code" className="w-48 h-48 object-contain" />
              </div>
              <p className="text-sm text-gray-400 text-center">Abra o WhatsApp no seu celular, toque em Dispositivos Conectados e aponte a câmera para esta tela.</p>
           </div>
        )}

        {/* Tabs */}
        {connected && (
          <div className="flex h-12 bg-[#111b21] border-b border-whatsapp-border shadow-sm flex-shrink-0">
            {['conversations', 'contacts'].map((tab) => (
              <button 
                key={tab}
                onClick={() => {
                  setActiveTab(tab as 'conversations' | 'contacts');
                  setSearchTerm('');
                }}
                className={`flex-1 text-sm font-semibold transition-colors ${
                  activeTab === tab 
                    ? 'text-whatsapp-green border-b-2 border-whatsapp-green' 
                    : 'text-gray-400 hover:text-white'
                }`}>
                {tab === 'conversations' ? 'Conversas' : 'Contatos do CRM'}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        {connected && (
          <div className="p-2 border-b border-whatsapp-border flex-shrink-0 bg-[#111b21]">
            <div className="flex items-center bg-[#202c33] rounded-lg px-4 gap-3 h-9">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input 
                type="text"
                placeholder={activeTab === 'conversations' ? "Pesquisar conversas..." : "Buscar no CRM..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-white outline-none text-sm placeholder-gray-400"
              />
            </div>
          </div>
        )}

        {/* List */}
        {connected && (
          <div className="flex-1 overflow-y-auto bg-[#111b21]">
            {activeTab === 'conversations' ? (
              /* Aba de Conversas */
              filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      onSelectConv(conv.id);
                      onToggle();
                    }}
                    className={`flex items-center px-3 py-3 cursor-pointer transition-colors border-b border-whatsapp-border
                      ${selectedConvId === conv.id ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'}`}>
                    
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-[#6b7c85] flex items-center justify-center flex-shrink-0 overflow-hidden mr-4">
                       <svg viewBox="0 0 24 24" width="28" height="28" fill="#d1d7db">
                         <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                       </svg>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[#e9edef] text-[17px] truncate" title={conv.contactName}>
                          {conv.contactName}
                        </span>
                        <span className={`text-[12px] flex-shrink-0 ml-2 ${conv.unreadCount > 0 ? 'text-whatsapp-green font-medium' : 'text-[#8696a0]'}`}>
                          {conv.timestamp}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className={`text-[14px] truncate ${conv.unreadCount > 0 ? 'text-[#e9edef] font-medium' : 'text-[#8696a0]'}`}>
                          {conv.lastMessage}
                        </span>
                        {conv.unreadCount > 0 && (
                          <div className="min-w-[20px] h-5 rounded-full bg-whatsapp-green text-[#111b21] text-[12px] font-medium flex items-center justify-center px-1 ml-2">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              /* Aba de Contatos do CRM */
              filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  {searchTerm ? 'Nenhum contato encontrado no CRM' : 'Nenhum contato no CRM'}
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const rawPhone = contact.phone || '';
                  const cleanPhone = rawPhone.replace(/\D/g, '');
                  // Formatando o ID da conversa esperado (ex: 5511999999999@s.whatsapp.net)
                  // Assumindo que o telefone no CRM já tenha DDI se começar com 55, senao adiciona 55
                  const ddiPhone = cleanPhone.startsWith('55') ? cleanPhone : (cleanPhone.length > 9 ? `55${cleanPhone}` : cleanPhone);
                  const waId = `${ddiPhone}@s.whatsapp.net`;

                  return (
                    <div
                      key={contact.id}
                      onClick={() => {
                        onSelectConv(waId);
                        onToggle();
                      }}
                      className="flex items-center px-3 py-3 cursor-pointer transition-colors border-b border-whatsapp-border hover:bg-[#202c33]">
                      
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0 overflow-hidden mr-4 text-white font-bold">
                         {contact.name?.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[#e9edef] text-[17px] truncate font-medium">
                            {contact.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[14px] text-[#8696a0] truncate">
                            {contact.phone || 'Sem número'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        )}
      </aside>
    </>
  );
}
