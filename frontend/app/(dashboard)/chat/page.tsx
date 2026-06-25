'use client';

import WhatsAppContainer from '@/components/whatsapp/WhatsAppContainer';
import WhatsAppHeader from '@/components/whatsapp/WhatsAppHeader';

export default function ConversasPage() {
  return (
    <div className="flex flex-col h-screen bg-whatsapp-dark">
      <WhatsAppHeader />
      <WhatsAppContainer />
    </div>
  );
}
