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
  attendees?: { email: string }[];
}

export interface CalendarResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

/**
 * Cria um evento no Google Calendar.
 */
export async function createCalendarEvent(eventData: CalendarEventData): Promise<CalendarResult> {
  if (!clientID || !clientSecret || !refreshToken) {
    return {
      success: false,
      error: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou GOOGLE_GMAIL_REFRESH_TOKEN ausentes no .env.',
    };
  }

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      sendUpdates: 'all',
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
        attendees: eventData.attendees || [],
      },
    });

    if (response.data.id) {
      return { success: true, eventId: response.data.id };
    }
    return { success: false, error: 'O Google não retornou um ID de evento.' };
  } catch (error: any) {
    console.error('[Google Calendar] Erro ao criar evento:', error.message || error);
    let errMsg = error.message || 'Erro desconhecido';
    if (error.response?.data?.error?.message) {
      errMsg = `${error.response.data.error.message} (${error.response.data.error.status || '403'})`;
    }
    return { success: false, error: errMsg };
  }
}

/**
 * Atualiza um evento existente no Google Calendar.
 */
export async function updateCalendarEvent(eventId: string, eventData: CalendarEventData): Promise<CalendarResult> {
  if (!clientID || !clientSecret || !refreshToken) {
    return {
      success: false,
      error: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou GOOGLE_GMAIL_REFRESH_TOKEN ausentes no .env.',
    };
  }

  try {
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all',
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
        attendees: eventData.attendees || [],
      },
    });

    if (response.data.id) {
      return { success: true, eventId: response.data.id };
    }
    return { success: false, error: 'O Google não retornou o ID do evento atualizado.' };
  } catch (error: any) {
    console.error('[Google Calendar] Erro ao atualizar evento:', error.message || error);
    let errMsg = error.message || 'Erro desconhecido';
    if (error.response?.data?.error?.message) {
      errMsg = `${error.response.data.error.message} (${error.response.data.error.status || '403'})`;
    }
    return { success: false, error: errMsg };
  }
}

/**
 * Remove um evento do Google Calendar.
 */
export async function deleteCalendarEvent(eventId: string): Promise<CalendarResult> {
  if (!clientID || !clientSecret || !refreshToken) {
    return {
      success: false,
      error: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou GOOGLE_GMAIL_REFRESH_TOKEN ausentes no .env.',
    };
  }

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all',
    });
    return { success: true };
  } catch (error: any) {
    console.error('[Google Calendar] Erro ao deletar evento:', error.message || error);
    let errMsg = error.message || 'Erro desconhecido';
    if (error.response?.data?.error?.message) {
      errMsg = `${error.response.data.error.message} (${error.response.data.error.status || '403'})`;
    }
    return { success: false, error: errMsg };
  }
}
