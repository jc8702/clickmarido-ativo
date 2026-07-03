import { google } from 'googleapis';

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectURI = process.env.GOOGLE_REDIRECT_URI;
const refreshToken = process.env.GOOGLE_GMAIL_REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(
  clientID,
  clientSecret,
  redirectURI
);

if (refreshToken) {
  oAuth2Client.setCredentials({
    refresh_token: refreshToken,
  });
}

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

export interface CalendarEventData {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: Date;
  endDateTime: Date;
}

/**
 * Cria um evento no Google Calendar.
 * Retorna o ID do evento criado ou null em caso de falha.
 */
export async function createCalendarEvent(eventData: CalendarEventData): Promise<string | null> {
  if (!clientID || !clientSecret || !refreshToken) {
    console.warn('[Google Calendar] Integração não configurada no .env.');
    return null;
  }

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: eventData.summary,
        description: eventData.description,
        location: eventData.location,
        start: {
          dateTime: eventData.startDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: eventData.endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
      },
    });

    return response.data.id || null;
  } catch (error: any) {
    console.error('[Google Calendar] Erro ao criar evento:', error.message || error);
    return null;
  }
}

/**
 * Atualiza um evento existente no Google Calendar.
 */
export async function updateCalendarEvent(eventId: string, eventData: CalendarEventData): Promise<string | null> {
  if (!clientID || !clientSecret || !refreshToken) {
    return null;
  }

  try {
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: {
        summary: eventData.summary,
        description: eventData.description,
        location: eventData.location,
        start: {
          dateTime: eventData.startDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: eventData.endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
      },
    });

    return response.data.id || null;
  } catch (error: any) {
    console.error('[Google Calendar] Erro ao atualizar evento:', error.message || error);
    return null;
  }
}

/**
 * Remove um evento do Google Calendar.
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  if (!clientID || !clientSecret || !refreshToken) {
    return false;
  }

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
    return true;
  } catch (error: any) {
    console.error('[Google Calendar] Erro ao deletar evento:', error.message || error);
    return false;
  }
}
