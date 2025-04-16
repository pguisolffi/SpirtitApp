// screens/RecuperarSenhaScreen.js
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, Dimensions } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebaseConfig'; // certifique-se que você está exportando auth
import Input from '../components/input';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

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
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Senha</Text>
      <Input
        placeholder="Digite seu e-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <View style={styles.buttonContainer}>
        <Button title="Enviar Link de Recuperação" onPress={handleRecuperarSenha} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: width * 0.05,
    backgroundColor: '#fff',
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: width * 0.06,
    marginBottom: height * 0.03,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    marginTop: height * 0.02,
  },
});
