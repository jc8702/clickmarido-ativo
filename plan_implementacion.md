# Plan de Implementación: Clone Fiel de WhatsApp Web (Consultor de Evolución)

## Diagnóstico y Prescripción Técnica

**Estado Actual:**
Tras escanear el proyecto (Next.js App Router, Prisma), observo que el módulo de chat en `page.tsx` realiza *polling* (llamadas HTTP repetitivas cada 4s y 30s) para obtener mensajes y listas de chat de la Evolution API. La resolución de contactos depende de una llamada inicial a `/contact/findContacts` y de los clientes del CRM. 
Esto genera el mayor punto de dolor actual: cuando un número no registrado o un grupo envía un mensaje, el sistema no captura su identidad (`pushName`, imagen, título del grupo) dinámicamente y la conversación no aparece en tiempo real.

**Objetivo (Estándar de Diamante):**
Elevar el entorno a un **clon exacto de WhatsApp Web**, tanto visualmente como a nivel de rendimiento en tiempo real, garantizando que todo contacto (registrado o no) y grupo funcione a la perfección dentro del CRM.

---

## 🛠️ Propuesta de Squad de Expertos

Para ejecutar esta evolución con la máxima calidad, propongo movilizar a:

1. **@backend-architect**: Encargado de destruir la arquitectura de "polling" y reemplazarla por **WebSockets o Server-Sent Events (SSE)** acoplados a los webhooks de la Evolution API para latencia cero.
2. **@ui-ux-pro**: Encargado de replicar milimétricamente la estética, proporciones, paneles e interacciones del WhatsApp Web original.
3. **@react-patterns**: Encargado de refactorizar el estado del frontend para soportar cachés locales, *optimistic updates* y la gestión de la cola de mensajes en React sin caídas de rendimiento.

---

## 🚀 Hoja de Ruta Técnica (Solución)

### Fase 1: Conectividad y Latencia Cero (Real-Time)
- **Eliminar Polling:** Remover los `setInterval` del frontend.
- **Implementar WebSocket/SSE:** Conectar el frontend para recibir eventos en vivo (ej. `messages.upsert`, `presence.update`). Esto hará que cualquier mensaje nuevo (incluso de desconocidos) cree el chat en la barra lateral instantáneamente.
- **Gestión de Webhooks:** Asegurar que Evolution API dispare webhooks correctamente hacia el sistema o usar su capa de WebSocket nativa.

### Fase 2: Resolución de Identidad (Desconocidos y Grupos)
- **Extracción de PushName:** Utilizar el `pushName` que viene adjunto en los eventos de mensajes entrantes para mostrar el nombre de personas no registradas en el CRM.
- **Soporte Completo a Grupos:** Detectar IDs terminados en `@g.us` y consultar `/group/metadata` para mostrar el título del grupo y los nombres de los participantes que envían mensajes.
- **Fotos de Perfil:** Implementar un componente dinámico que haga lazy-loading de la foto de perfil llamando a `/chat/fetchProfilePictureUrl`.

### Fase 3: Replicación Visual de WhatsApp Web (UI/UX)
- **Layout Fiel:** Panel izquierdo persistente (30-35% del ancho) para la lista de chats, y panel derecho principal con fondo característico y cabecera pegajosa.
- **Integración CRM:** Agregar un botón flotante y discreto en la cabecera de chats desconocidos que diga *"➕ Añadir a CRM ClickMarido"*, manteniendo la estética original.
- **Renderizado de Múltiples Módulos:** Estilizar correctamente imágenes, audios y documentos tal como WA Web.

---

## User Review Required

> [!IMPORTANT]
> **Preguntas de Aprobación para Iniciar la Ejecución:**
> 
> 1. **Conexión en Tiempo Real:** ¿Tienes configurados los Webhooks de Evolution API apuntando a tu backend o prefieres que conectemos el frontend directamente al WebSocket expuesto por Evolution API?
> 2. **Alcance:** ¿Deseas que implementemos también el envío de imágenes y audios (micrófono) en este primer esfuerzo, o nos centramos primero en que el chat de texto, grupos y contactos funcionen idéntico a WhatsApp Web?

Por favor, aprueba este plan (y responde las preguntas) para que el Squad materialice las tareas y comience a programar el rediseño.
