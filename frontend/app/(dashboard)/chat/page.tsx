'use client';

import { Suspense } from 'react';
import WhatsAppContainer from '@/components/whatsapp/WhatsAppContainer';
import WhatsAppHeader from '@/components/whatsapp/WhatsAppHeader';

export default function ConversasPage() {
  return (
    <div className="flex flex-col h-screen bg-whatsapp-dark">
      <WhatsAppHeader />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white">Carregando Chat...</div>}>
        <WhatsAppContainer />
      </Suspense>
    </div>
  );
}
