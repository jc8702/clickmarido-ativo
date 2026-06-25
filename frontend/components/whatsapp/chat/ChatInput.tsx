'use client';

import { Smile, Paperclip, Mic, Send } from 'lucide-react';
import { useState, useRef } from 'react';

export default function ChatInput({ onSendMessage }: { onSendMessage?: (text: string, file: File | null) => void }) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!message.trim() || !onSendMessage) return;
    setIsSending(true);
    await onSendMessage(message, null);
    setMessage('');
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendMessage) {
      setIsSending(true);
      await onSendMessage('', file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsSending(false);
    }
  };

  return (
    <div className="h-[62px] px-4 bg-whatsapp-card border-t border-whatsapp-border flex items-center gap-4">
      {/* Action Icons */}
      <div className="flex items-center gap-3 text-gray-400 relative">
        <Smile className="w-6 h-6 cursor-pointer hover:text-whatsapp-green transition" />
        <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            onChange={handleFileChange}
        />
        <Paperclip 
            className="w-6 h-6 cursor-pointer hover:text-whatsapp-green transition" 
            onClick={() => fileInputRef.current?.click()}
        />
      </div>

      {/* Input */}
      <div className="flex-1">
        <input 
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem"
          className="w-full bg-[#2a3942] text-white rounded-lg px-4 py-2 outline-none text-[15px]"
          disabled={isSending}
        />
      </div>

      {/* Send or Mic */}
      <div className="text-gray-400">
        {message.trim() ? (
          <button 
             onClick={handleSend}
             disabled={isSending}
             className={`p-2 rounded-full transition ${isSending ? 'bg-gray-500' : 'bg-whatsapp-green hover:bg-green-600'} text-white`}>
            <Send className="w-5 h-5 ml-1" />
          </button>
        ) : (
          <Mic className="w-6 h-6 cursor-pointer hover:text-whatsapp-green transition" />
        )}
      </div>
    </div>
  );
}
