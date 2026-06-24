# Backlog: Evolución a WhatsApp Web Clone (ClickMarido CRM)

## Fase 1: Sincronización Real-Time y Resolución de Nombres (Backend / Conectividad)
- [ ] Investigar configuración de webhooks / WebSockets expuestos por la Evolution API.
- [ ] Implementar conexión WebSocket o Server-Sent Events (SSE) en el frontend (o vía API route de Next.js) para reemplazar el `setInterval` de 4s y 30s.
- [ ] Configurar listeners para `messages.upsert` (nuevos mensajes) y `presence.update` (escribiendo/grabando audio) para renderizar eventos en vivo.
- [ ] Ajustar lógica de carga de chats para extraer `pushName` del payload de mensajes de la Evolution API cuando el número no esté en el CRM.
- [ ] Implementar detección de grupos (`@g.us`) y llamar a `/group/metadata` para obtener el título del grupo y los nombres de los participantes.
- [ ] Implementar endpoint/servicio para cargar asíncronamente fotos de perfil usando `/chat/fetchProfilePictureUrl`.

## Fase 2: Interface "WhatsApp Web Clone" (UI/UX)
- [ ] Rediseñar `page.tsx` para adoptar la estructura de doble panel idéntica a WA Web (Lista Izquierda: 30%, Chat Activo Derecho: 70%).
- [ ] Aplicar esquema de colores y tipografía de WhatsApp Web, soportando Modo Claro y Modo Oscuro.
- [ ] Recrear las cabeceras pegajosas (Sticky Headers) tanto para la lista de chats como para la ventana principal del chat.
- [ ] Recrear las burbujas de chat (Message Bubbles) con la estética correcta, espaciado y colitas (tails) de WhatsApp.

## Fase 3: Funcionalidades Avanzadas e Integración CRM
- [ ] Integrar botón flotante contextual: Si un contacto no está en la base del CRM, mostrar un botón rápido "➕ Añadir a CRM".
- [ ] Expandir el motor de visualización de medios para renderizar imágenes, documentos, audios (con visualizador waveform o nativo) y videos.
- [ ] Soportar respuestas a mensajes específicos (Reply To) y visualización del mensaje citado en las burbujas de texto.
- [ ] Reemplazar la entrada de texto por un Input auto-expandible, botón de emojis, adjuntar archivos y micrófono para grabar audios.
