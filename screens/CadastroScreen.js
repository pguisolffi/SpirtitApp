import React from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import Input from '../components/input';
import { useRouter } from 'expo-router'; 

const { width, height } = Dimensions.get('window');

export default function CadastroScreen({ navigation }) {

  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cadastro</Text>

      <Input placeholder="Nome completo" />
      <Input placeholder="Email" keyboardType="email-address" />
      <Input placeholder="Telefone com DDD" keyboardType="phone-pad" />
      <Input placeholder="Senha" secureTextEntry />
      <Input placeholder="Confirmar senha" secureTextEntry />

      <View style={styles.buttonContainer}>
        <Button title="Cadastrar" onPress={() => alert('Cadastro enviado!')} />
      </View>

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.loginLink}>Já tem conta? Voltar ao Login </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: width * 0.05,
    backgroundColor: '#fff',
    justifyContent: 'center',
    flexGrow: 1,
  },
  title: {
    fontSize: width * 0.06,
    marginBottom: height * 0.03,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    marginVertical: height * 0.02,
  },
  loginLink: {
    textAlign: 'center',
    color: '#007AFF',
    fontSize: width * 0.04,
  },
});
