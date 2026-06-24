import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch, BASE_URL } from '../services/api';
import { Lock, Mail, ShieldAlert } from 'lucide-react-native';

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });

      if (!data.token) {
        throw new Error('Token não retornado pelo servidor');
      }

      // Salvar os dados do login
      await AsyncStorage.setItem('@ClickMarido:token', data.token);
      await AsyncStorage.setItem('@ClickMarido:user', JSON.stringify(data.user));

      onLoginSuccess(data.user);
    } catch (error: any) {
      console.error('Erro de login:', error);
      Alert.alert('Falha no Login', error.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <ThemedView style={styles.container}>
          {/* Cabeçalho de Logo */}
          <ThemedView style={styles.header}>
            <ThemedView style={[styles.logoIcon, { backgroundColor: '#0284c7' }]}>
              <ThemedText style={styles.logoText}>CM</ThemedText>
            </ThemedView>
            <ThemedText type="title" style={styles.title}>Click Marido</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Área do Técnico em Campo
            </ThemedText>
          </ThemedView>

          {/* Formulário */}
          <ThemedView style={[styles.form, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={styles.label}>E-mail</ThemedText>
            <ThemedView style={[styles.inputContainer, { backgroundColor: theme.background }]}>
              <Mail size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="tecnico@clickmarido.com.br"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </ThemedView>

            <ThemedText style={[styles.label, { marginTop: Spacing.two }]}>Senha</ThemedText>
            <ThemedView style={[styles.inputContainer, { backgroundColor: theme.background }]}>
              <Lock size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="••••••••"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </ThemedView>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#0284c7' }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Entrar</ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.footer}>
            <ShieldAlert size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
              Apenas técnicos autorizados. IP monitorado.
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.five,
    gap: Spacing.one,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
  },
  form: {
    padding: Spacing.four,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    gap: Spacing.one,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.one,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb22',
    paddingHorizontal: Spacing.two,
  },
  inputIcon: {
    marginRight: Spacing.one,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  button: {
    marginTop: Spacing.three,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
    gap: Spacing.one,
  },
  footerText: {
    fontSize: 11,
  },
});
