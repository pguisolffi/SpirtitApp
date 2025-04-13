// screens/LoginScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import Input from '../components/input';
import { useRouter } from 'expo-router';  

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fraternidade Bezerra de Menezes</Text>

      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Input placeholder="Email" />
      <Input placeholder="Senha" secureTextEntry />

      <View style={styles.buttonContainer}>
        <Button title="Entrar" onPress={() => router.push('/Rota_HomeFuncionario')} />
      </View>

      <TouchableOpacity onPress={() => router.push('/cadastro')}>
        <Text style={styles.register}>Cadastre-se</Text>
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
  title: {
    fontSize: width * 0.05,
    marginBottom: height * 0.015,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  logo: {
    width: width * 0.8,
    height: width * 0.8,
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
