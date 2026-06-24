import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { LoginView } from '@/components/LoginView';
import { AgendaView } from '@/components/AgendaView';
import { OSDetailView } from '@/components/OSDetailView';
import { apiFetch, OfflineStorage } from '../services/api';

export default function App() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedOSId, setSelectedOSId] = useState<string | null>(null);

  // Verificar se o usuário já possui token salvo
  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await AsyncStorage.getItem('@ClickMarido:token');
        const savedUser = await AsyncStorage.getItem('@ClickMarido:user');

        if (token && savedUser) {
          // Tenta validar o token no servidor
          try {
            const data = await apiFetch('/auth/verify', { method: 'GET' });
            if (data.valid) {
              setUser(data.user);
            } else {
              throw new Error('Token inválido');
            }
          } catch (netErr) {
            // Em caso de falha de conexão, aceitamos os dados salvos localmente
            console.log('Verificação online falhou, usando autenticação offline:', netErr);
            setUser(JSON.parse(savedUser));
          }
        }
      } catch (error) {
        console.error('Erro de autenticação local:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@ClickMarido:token');
      await AsyncStorage.removeItem('@ClickMarido:user');
      await AsyncStorage.removeItem('@ClickMarido:os_cache');
      setUser(null);
      setSelectedOSId(null);
    } catch (error) {
      console.error('Erro ao sair do app:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <ThemedView style={styles.center}>
          <ActivityIndicator size="large" color="#0284c7" />
          <ThemedText style={{ marginTop: 12 }}>Carregando dados...</ThemedText>
        </ThemedView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        {!user ? (
          <LoginView onLoginSuccess={handleLoginSuccess} />
        ) : selectedOSId ? (
          <OSDetailView osId={selectedOSId} onBack={() => setSelectedOSId(null)} />
        ) : (
          <AgendaView
            user={user}
            onLogout={handleLogout}
            onSelectOS={(id) => setSelectedOSId(id)}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
