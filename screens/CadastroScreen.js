import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import Input from '../components/input';
import { useRouter } from 'expo-router';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebaseConfig'; // certifique-se que você exportou `auth` lá também

const { width, height } = Dimensions.get('window');

export default function CadastroScreen({ navigation }) {
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const handleCadastro = async () => {
    if (!nome || !email || !telefone || !senha || !confirmarSenha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    try {
      // Verificar se o e-mail já existe no Auth (alternativo: Firebase Auth já lança erro)
      const querySnapshot = await getDocs(
        query(collection(db, 'bzmusuario'), where('email', '==', email))
      );

      if (!querySnapshot.empty) {
        Alert.alert('Erro', 'Este e-mail já está cadastrado.');
        return;
      }

      // Criar usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Salvar dados no Firestore
      await addDoc(collection(db, 'bzmusuario'), {
        uid: user.uid,
        nome,
        email,
        telefone,
        perfil: 'ADMINISTRADOR',
        permissoes: 'Todas',
        endereco: 'Endereço não informado',
        idUsuario: Date.now(),
        dtnascimento: serverTimestamp(),
      });

      Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
      router.push('/login');
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Erro', 'Este e-mail já está em uso.');
      } else {
        Alert.alert('Erro', 'Ocorreu um erro ao cadastrar.');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cadastro</Text>

      <Input placeholder="Nome completo" value={nome} onChangeText={setNome} />
      <Input placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Input placeholder="Telefone com DDD" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
      <Input placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />
      <Input placeholder="Confirmar senha" value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry />

      <View style={styles.buttonContainer}>
        <Button title="Cadastrar" onPress={handleCadastro} />
      </View>

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.loginLink}>Já tem conta? Voltar ao Login</Text>
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
