'use client';

import { Lock, MessageCircle } from 'lucide-react';

export default function WelcomeScreen() {
  return (
    <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-gray-100 dark:bg-[#222e35] border-l border-gray-200 dark:border-[#222d34]">
      {/* Main Content */}
      <div className="flex flex-col items-center text-center px-8 max-w-lg">
        {/* Illustration - WhatsApp-like icon */}
        <div className="relative mb-8">
          <svg width="280" height="168" viewBox="0 0 280 168" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background shapes */}
            <circle cx="140" cy="84" r="70" fill="#00a884" opacity="0.08" />
            <circle cx="140" cy="84" r="50" fill="#00a884" opacity="0.12" />
            
            {/* WhatsApp-like phone icon */}
            <rect x="105" y="44" width="70" height="90" rx="10" fill="#00a884" />
            <rect x="112" y="51" width="56" height="68" rx="3" fill="white" />
            <circle cx="140" cy="129" r="3.5" fill="#00a884" />
            
            {/* Chat bubbles */}
            <rect x="70" y="60" width="35" height="20" rx="6" fill="#00a884" opacity="0.5" />
            <rect x="175" y="78" width="40" height="20" rx="6" fill="#00a884" opacity="0.35" />
            <rect x="60" y="88" width="30" height="16" rx="5" fill="#00a884" opacity="0.25" />
            
            {/* Decorative elements */}
            <circle cx="85" cy="52" r="5" fill="#00a884" opacity="0.4" />
            <circle cx="195" cy="70" r="6" fill="#00a884" opacity="0.35" />
            <circle cx="160" cy="128" r="4" fill="#00a884" opacity="0.5" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-black dark:text-[#e9edef] text-[32px] font-light mb-3 leading-tight">
          WhatsApp Business Web
        </h1>

        {/* Description */}
        <p className="text-gray-500 dark:text-[#8696a0] text-[14px] leading-relaxed mb-6 max-w-[400px]">
          Envie e receba mensagens pelo navegador. Para começar, selecione uma conversa na barra lateral.
        </p>

        {/* Divider */}
        <div className="w-full max-w-[320px] border-t border-gray-300 dark:border-[#364147] mb-6" />

        {/* Instructions */}
        <div className="flex flex-col gap-3 text-left max-w-[360px]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#00a884]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageCircle className="w-4 h-4 text-[#00a884]" />
            </div>
            <div>
              <p className="text-black dark:text-[#e9edef] text-[14px] font-medium">
                Inicie uma conversa
              </p>
              <p className="text-gray-500 dark:text-[#8696a0] text-[13px]">
                Clique em uma conversa existente ou inicie uma nova pelo botão "+"
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#00a884]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg viewBox="0 0 16 15" width="16" height="15" className="text-[#00a884]">
                <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
              </svg>
            </div>
            <div>
              <p className="text-black dark:text-[#e9edef] text-[14px] font-medium">
                Mensagens criptografadas
              </p>
              <p className="text-gray-500 dark:text-[#8696a0] text-[13px]">
                Suas mensagens são protegidas com criptografia de ponta a ponta
              </p>
            </div>
          </div>
        </div>

        {/* Security notice */}
        <div className="flex items-center gap-2 text-gray-500 dark:text-[#8696a0] text-[13px] mt-8">
          <Lock className="w-4 h-4" />
          <span>Clique Marido - WhatsApp Business</span>
        </div>
      </div>
    </div>
  );
}
