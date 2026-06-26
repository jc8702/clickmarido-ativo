'use client';

import { useState, useCallback } from 'react';

// ==========================================
// HOOK: useWhatsAppApi
// Consumo das rotas de backend (favorites, archived, labels)
// ==========================================

import type { WhatsAppLabel, WhatsAppFavorite, WhatsAppArchived } from '../types';

// Re-exportar para compatibilidade com código existente
export type { WhatsAppLabel, WhatsAppFavorite, WhatsAppArchived };

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ==========================================
// FAVORITOS
// ==========================================

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/favorites', {
        headers: authHeaders(),
      });
      if (res.ok) {
        const { data } = await res.json();
        const phones = new Set<string>(data.map((f: WhatsAppFavorite) => f.phone));
        setFavorites(phones);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  }, []);

  const toggleFavorite = useCallback(async (phone: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/whatsapp/favorites', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        const { action } = await res.json();
        setFavorites(prev => {
          const next = new Set(prev);
          if (action === 'added') next.add(phone);
          else next.delete(phone);
          return next;
        });
        return action === 'added';
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
    return false;
  }, []);

  const isFavorite = useCallback((phone: string) => favorites.has(phone), [favorites]);

  return { favorites, fetchFavorites, toggleFavorite, isFavorite };
}

// ==========================================
// ARQUIVAMENTO
// ==========================================

export function useArchived() {
  const [archived, setArchived] = useState<Set<string>>(new Set());

  const fetchArchived = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/archived', {
        headers: authHeaders(),
      });
      if (res.ok) {
        const { data } = await res.json();
        const phones = new Set<string>(data.map((a: WhatsAppArchived) => a.phone));
        setArchived(phones);
      }
    } catch (err) {
      console.error('Error fetching archived:', err);
    }
  }, []);

  const toggleArchive = useCallback(async (phone: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/whatsapp/archived', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        const { action } = await res.json();
        setArchived(prev => {
          const next = new Set(prev);
          if (action === 'archived') next.add(phone);
          else next.delete(phone);
          return next;
        });
        return action === 'archived';
      }
    } catch (err) {
      console.error('Error toggling archive:', err);
    }
    return false;
  }, []);

  const isArchived = useCallback((phone: string) => archived.has(phone), [archived]);

  return { archived, fetchArchived, toggleArchive, isArchived };
}

// ==========================================
// ETIQUETAS
// ==========================================

export function useLabels() {
  const [labels, setLabels] = useState<WhatsAppLabel[]>([]);
  const [conversationLabels, setConversationLabels] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/labels', {
        headers: authHeaders(),
      });
      if (res.ok) {
        const { data } = await res.json();
        setLabels(data);
      }
    } catch (err) {
      console.error('Error fetching labels:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLabel = useCallback(async (name: string, color: string): Promise<WhatsAppLabel | null> => {
    try {
      const res = await fetch('/api/whatsapp/labels', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name, color }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setLabels(prev => [...prev, data]);
        return data;
      }
    } catch (err) {
      console.error('Error creating label:', err);
    }
    return null;
  }, []);

  const updateLabel = useCallback(async (id: string, updates: Partial<WhatsAppLabel>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/whatsapp/labels/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const { data } = await res.json();
        setLabels(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
        return true;
      }
    } catch (err) {
      console.error('Error updating label:', err);
    }
    return false;
  }, []);

  const deleteLabel = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/whatsapp/labels/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        setLabels(prev => prev.filter(l => l.id !== id));
        return true;
      }
    } catch (err) {
      console.error('Error deleting label:', err);
    }
    return false;
  }, []);

  const toggleLabelOnConversation = useCallback(async (phone: string, labelId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/whatsapp/labels/assign', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ phone, labelId }),
      });
      if (res.ok) {
        const { action } = await res.json();
        setConversationLabels(prev => {
          const next = new Map(prev);
          const current = next.get(phone) || [];
          if (action === 'assigned') {
            next.set(phone, [...current, labelId]);
          } else {
            next.set(phone, current.filter(id => id !== labelId));
          }
          return next;
        });
        return action === 'assigned';
      }
    } catch (err) {
      console.error('Error toggling label assignment:', err);
    }
    return false;
  }, []);

  const getLabelsForPhone = useCallback((phone: string) => {
    const labelIds = conversationLabels.get(phone) || [];
    return labels.filter(l => labelIds.includes(l.id));
  }, [labels, conversationLabels]);

  const getConversationsForLabel = useCallback((labelId: string) => {
    const result: string[] = [];
    conversationLabels.forEach((labelIds, phone) => {
      if (labelIds.includes(labelId)) result.push(phone);
    });
    return result;
  }, [conversationLabels]);

  return {
    labels,
    loading,
    fetchLabels,
    createLabel,
    updateLabel,
    deleteLabel,
    toggleLabelOnConversation,
    getLabelsForPhone,
    getConversationsForLabel,
  };
}
