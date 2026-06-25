'use client';

import { Suspense } from 'react';
import WhatsAppContainer from '@/components/whatsapp/WhatsAppContainer';

export default function ConversasPage() {
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#111b21]">
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center text-black dark:text-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#667781] dark:text-[#8696a0]">Carregando Chat...</p>
          </div>
        </div>
      }>
        <WhatsAppContainer />
      </Suspense>
    </div>
  );
}
