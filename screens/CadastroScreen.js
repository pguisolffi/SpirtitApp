import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { db, auth } from './firebaseConfig';
import { width, height } from '../constants/Layout';
import { MaterialIcons } from '@expo/vector-icons';

import ScreenWrapper from '../components/ScreenWrapper';

export default function CadastroScreen({ navigation }) {
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [erros, setErros] = useState({
    nome: false,
    email: false,
    telefone: false,
    senha: false,
    confirmarSenha: false,
  });

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const showToast = (message, callback) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setToastVisible(false);
      if (callback) callback();
    });
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleCadastro = async () => {
    const novosErros = {
      nome: !nome.trim(),
      email: !email.trim(),
      telefone: !telefone.trim(),
      senha: !senha.trim(),
      confirmarSenha: !confirmarSenha.trim(),
    };
    setErros(novosErros);

    if (novosErros.nome || novosErros.email || novosErros.telefone || novosErros.senha || novosErros.confirmarSenha) {
      triggerShake();
      return;
    }

    if (senha !== confirmarSenha) {
      setErros({
        nome: false,
        email: false,
        telefone: false,
        senha: true,
        confirmarSenha: true,
      });
      triggerShake();
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'bzmusuario'), where('email', '==', email))
      );

      if (!querySnapshot.empty) {
        setErros((prev) => ({ ...prev, email: true }));
        triggerShake();
        Alert.alert('Erro', 'Este e-mail já está cadastrado.');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      await addDoc(collection(db, 'bzmusuario'), {
        uid: user.uid,
        nome,
        email,
        telefone,
        perfil: 'ADMINISTRADOR',
        permissoes: ['*'],
        endereco: 'Endereço não informado',
        idUsuario: Date.now(),
        dtnascimento: serverTimestamp(),
      });

      showToast('Cadastro realizado com sucesso!', () => {
        router.push('/login');
      });
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      if (error.code === 'auth/email-already-in-use') {
        setErros((prev) => ({ ...prev, email: true }));
        triggerShake();
        Alert.alert('Erro', 'Este e-mail já está em uso.');
      } else {
        Alert.alert('Erro', 'Ocorreu um erro ao cadastrar.');
      }
    }
  };

  return (
    <ScreenWrapper title="Cadastro" showHeader={false}>
      <LinearGradient colors={['#e0f7fa', '#ffffff']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Cadastre-se</Text>
          <View style={styles.formBox}>
            <Animated.View style={[{ transform: [{ translateX: shakeAnimation }] }, { width: '100%' }]}>
              <Input 
                placeholder="Nome completo" 
                value={nome} 
                onChangeText={(text) => {
                  setNome(text);
                  if (text) setErros((prev) => ({ ...prev, nome: false }));
                }}
                style={erros.nome && styles.inputErro}
              />
              <Input 
                placeholder="Email" 
                value={email} 
                onChangeText={(text) => {
                  setEmail(text);
                  if (text) setErros((prev) => ({ ...prev, email: false }));
                }} 
                keyboardType="email-address" 
                style={erros.email && styles.inputErro}
              />
              <Input 
                placeholder="Telefone com DDD" 
                value={telefone} 
                onChangeText={(text) => {
                  setTelefone(text);
                  if (text) setErros((prev) => ({ ...prev, telefone: false }));
                }} 
                keyboardType="phone-pad" 
                style={erros.telefone && styles.inputErro}
              />
              <Input 
                placeholder="Senha" 
                value={senha} 
                onChangeText={(text) => {
                  setSenha(text);
                  if (text) setErros((prev) => ({ ...prev, senha: false }));
                }} 
                secureTextEntry 
                style={erros.senha && styles.inputErro}
              />
              <Input 
                placeholder="Confirmar senha" 
                value={confirmarSenha} 
                onChangeText={(text) => {
                  setConfirmarSenha(text);
                  if (text) setErros((prev) => ({ ...prev, confirmarSenha: false }));
                }} 
                secureTextEntry 
                style={erros.confirmarSenha && styles.inputErro}
              />
            </Animated.View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.botaoSalvar} onPress={handleCadastro}>
                <Text style={styles.botaoTexto}>Cadastrar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Já tem conta? Voltar ao Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      {toastVisible && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <MaterialIcons name="check-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: height * 0.05,
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
    marginVertical: height * 0.02,
    width: '100%',
  },
  botaoSalvar: {
    backgroundColor: '#5A90E0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputErro: {
    borderColor: '#DC5C5C',
    borderWidth: 1.5,
  },
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: '10%',
    right: '10%',
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loginLink: {
    textAlign: 'center',
    color: '#007AFF',
    fontSize: width * 0.04,
    marginTop: 10,
  },
});
