'use client';

import { Lock } from 'lucide-react';

export default function WelcomeScreen() {
  return (
    <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-gray-100 dark:bg-[#222e35] border-l border-gray-200 dark:border-[#222d34]">
      {/* Main Content */}
      <div className="flex flex-col items-center text-center px-8 max-w-md">
        {/* Illustration - WhatsApp-like icon */}
        <div className="relative mb-8">
          <svg width="320" height="188" viewBox="0 0 320 188" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background shapes */}
            <circle cx="160" cy="94" r="80" fill="#00a884" opacity="0.1" />
            <circle cx="160" cy="94" r="60" fill="#00a884" opacity="0.15" />
            
            {/* WhatsApp-like phone icon */}
            <rect x="120" y="54" width="80" height="100" rx="12" fill="#00a884" />
            <rect x="128" y="62" width="64" height="76" rx="4" fill="white" />
            <circle cx="160" cy="146" r="4" fill="#00a884" />
            
            {/* Chat bubbles */}
            <rect x="80" y="70" width="40" height="24" rx="8" fill="#00a884" opacity="0.6" />
            <rect x="200" y="90" width="45" height="24" rx="8" fill="#00a884" opacity="0.4" />
            <rect x="70" y="100" width="35" height="20" rx="6" fill="#00a884" opacity="0.3" />
            
            {/* Decorative elements */}
            <circle cx="100" cy="60" r="6" fill="#00a884" opacity="0.5" />
            <circle cx="220" cy="80" r="8" fill="#00a884" opacity="0.4" />
            <circle cx="180" cy="140" r="5" fill="#00a884" opacity="0.6" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-black dark:text-[#e9edef] text-[32px] font-light mb-4">
          WhatsApp Business Web
        </h1>

        {/* Description */}
        <p className="text-gray-500 dark:text-[#8696a0] text-[14px] leading-relaxed mb-8">
          Amplie, organize e gerencie sua conta comercial.
        </p>

        {/* Divider */}
        <div className="w-full border-t border-gray-300 dark:border-[#364147] mb-8" />

        {/* Security notice */}
        <div className="flex items-center gap-2 text-gray-500 dark:text-[#8696a0] text-[13px]">
          <Lock className="w-4 h-4" />
          <span>Suas mensagens pessoais são protegidas com a criptografia de ponta a ponta.</span>
        </div>
      </div>
    </div>
  );
}
