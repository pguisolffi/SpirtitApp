import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, Dimensions, Image, Alert } from 'react-native';
import Input from '../components/input';
import { useRouter } from 'expo-router';  
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig'; // <-- ajuste caminho conforme seu projeto

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Preencha o email e a senha.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      
      // Se chegou aqui, login foi bem-sucedido
      Alert.alert('Bem-vindo!', `Login realizado com sucesso!`);
      router.push('/Rota_HomeFuncionario');
    } catch (error) {
      console.error('Erro ao logar:', error);
      Alert.alert('Erro', 'Email ou senha inválidos.');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Input placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Input placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />

      <View style={styles.buttonContainer}>
        <Button title="Entrar" onPress={handleLogin} />
      </View>

      <TouchableOpacity onPress={() => router.push('/cadastroUsuarioScreen')}>
        <Text style={styles.register}>Cadastre-se</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/Rota_RecuperarSenhaScreen')}>
  <Text style={{ textAlign: 'center', color: '#007AFF', marginTop: 10 }}>
    Esqueceu a senha?
  </Text>
</TouchableOpacity>

      <Text style={styles.footer}>
        © 2025 - Fraternidade Bezerra de Menezes - Cachoeira do Bom Jesus
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: width * 0.05,
    backgroundColor: '#fff',
  },
  logo: {
    width: width * 0.9,
    height: width * 0.9,
    marginBottom: height * 0.03,
    alignSelf: 'center',
  },
  buttonContainer: {
    marginVertical: height * 0.015,
  },
  register: {
    marginTop: height * 0.01,
    color: '#007AFF',
    textAlign: 'center',
    fontSize: width * 0.04,
  },
  footer: {
    marginTop: height * 0.04,
    fontSize: width * 0.035,
    textAlign: 'center',
    color: '#999',
  },
});
