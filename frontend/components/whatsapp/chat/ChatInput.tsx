'use client';

import { Smile, Paperclip, Mic, Send, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage?: (text: string, file: File | null) => void;
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 150) + 'px';
    }
  }, [message]);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async () => {
    if (!message.trim() || !onSendMessage) return;
    setIsSending(true);
    await onSendMessage(message, null);
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  // Common emojis
  const quickEmojis = ['😀', '😂', '❤️', '👍', '🙏', '😍', '🤔', '😊', '😎', '🥰', '😢', '😤', '👍', '👋', '🎉', '🔥'];

  return (
    <div className="bg-[#202c33] border-t border-[#222d34] flex-shrink-0">
      <div className="flex items-end gap-2 px-4 py-3">
        {/* Emoji Button + Picker */}
        <div className="relative" ref={emojiPickerRef}>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[#8696a0] hover:text-white hover:bg-[#2a3942] transition-all flex-shrink-0"
          >
            <Smile className="w-6 h-6" />
          </button>
          
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 w-[320px] bg-[#233138] rounded-lg shadow-xl p-3 z-50">
              <div className="grid grid-cols-8 gap-1">
                {quickEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => addEmoji(emoji)}
                    className="w-9 h-9 flex items-center justify-center text-xl hover:bg-[#2a3942] rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Attach Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[#8696a0] hover:text-white hover:bg-[#2a3942] transition-all flex-shrink-0"
        >
          <Paperclip className="w-6 h-6 rotate-45" />
        </button>
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          onChange={handleFileChange}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />

        {/* Input Field */}
        <div className="flex-1 min-h-[42px] max-h-[150px] bg-[#2a3942] rounded-lg flex items-end">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem"
            rows={1}
            className="flex-1 bg-transparent text-[#e9edef] text-[15px] px-3 py-[9px] outline-none resize-none leading-[20px] placeholder-[#8696a0] max-h-[150px]"
            style={{ height: 'auto', minHeight: '42px' }}
            disabled={isSending}
          />
        </div>

        {/* Send / Mic Button */}
        {message.trim() ? (
          <button
            onClick={handleSend}
            disabled={isSending}
            className="w-[42px] h-[42px] rounded-full bg-[#00a884] hover:bg-[#06cf9c] flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-white ml-0.5" />
          </button>
        ) : (
          <button
            className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[#8696a0] hover:text-white hover:bg-[#2a3942] transition-all flex-shrink-0"
            title="Mensagem de voz"
          >
            <Mic className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
