// screens/RecuperarSenhaScreen.js
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebaseConfig'; // certifique-se que você está exportando auth
import Input from '../components/input';
import { useRouter } from 'expo-router';
import { width, height } from '../constants/Layout';

import ScreenWrapper from '../components/ScreenWrapper';

export default function RecuperarSenhaScreen() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleRecuperarSenha = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, insira o e-mail.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Verifique seu e-mail',
        'Enviamos um link para redefinir sua senha.'
      );
      router.push('/login');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar recuperar a senha.');
    }
  };

  return (
    <ScreenWrapper title="Recuperar Senha" showHeader={false}>
      <LinearGradient colors={['#e0f7fa', '#ffffff']} style={styles.container}>
        <View style={styles.scrollContainer}>
          <Text style={styles.title}>Recuperar Senha</Text>
          <View style={styles.formBox}>
            <Input
              placeholder="Digite seu e-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <View style={styles.buttonContainer}>
              <Button title="Enviar Link de Recuperação" onPress={handleRecuperarSenha} />
            </View>

            <TouchableOpacity onPress={() => router.push('/login')} style={{ marginTop: 20 }}>
              <Text style={styles.loginLink}>Voltar ao Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: width * 0.05,
  },
  scrollContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: width * 0.06,
    marginBottom: height * 0.03,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  formBox: {
    width: '100%',
    paddingHorizontal: 10,
    ...(Platform.OS === 'web' && {
      maxWidth: 420,
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 32,
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.05,
      shadowRadius: 20,
      elevation: 5,
      marginTop: 20,
    }),
  },
  buttonContainer: {
    marginTop: height * 0.02,
    width: '100%',
  },
  loginLink: {
    textAlign: 'center',
    color: '#007AFF',
    fontSize: width * 0.04,
  },
});
