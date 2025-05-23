import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { getAuth, signInWithCredential, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Input from '../components/input';
import { auth } from './firebaseConfig';
import { AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native'; // << Adicionado aqui

const { width, height } = Dimensions.get('window');
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false); // << Novo estado para controlar animação

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'SEUS_CLIENT_IDS_AQUI',
    webClientId: 'SEUS_CLIENT_IDS_AQUI',
    androidClientId: 'SEUS_CLIENT_IDS_AQUI',
    iosClientId: 'SEUS_CLIENT_IDS_AQUI',
    redirectUri: 'https://auth.expo.io/@pguisolffi/SpiritApp',
    useProxy: true,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.params?.id_token) {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);

      setLoading(true);
      signInWithCredential(auth, credential)
        .then(() => {
          Alert.alert('Bem-vindo!');
          router.push('/Rota_HomeFuncionario');
        })
        .catch((err) => {
          console.error('Erro ao autenticar no Firebase:', err);
          Alert.alert('Erro', 'Falha ao autenticar com Google.');
        })
        .finally(() => setLoading(false)); // Para a animação
    } else if (response?.type === 'error') {
      console.error('Erro na resposta OAuth do Google:', response);
      setLoading(false);
    }
  }, [response]);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Preencha o email e a senha.');
      return;
    }

    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      router.push('/Rota_HomeFuncionario');
    } catch (error) {
      console.error('Erro ao logar:', error);
      Alert.alert('Erro', 'Email ou senha inválidos.');
    } finally {
      setLoading(false); // Para a animação
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={['#e0f7fa', '#ffffff']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {!loading && (
            <Animatable.Image
              animation="fadeInDown"
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          )} 


          {/* Se estiver carregando, mostra a animação */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <LottieView
                source={require('../assets/birds.json')} // precisa de uma animação lottie de pássaros
                autoPlay
                loop
                style={{ width: 200, height: 200 }}
              />
              <Text style={{ marginTop: 20, fontSize: 16, color: '#555' }}>Aguarde...</Text>
            </View>
          )}

          {!loading && (
            <Animatable.View animation="fadeInUp" style={styles.formBox}>
              <Input placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <Input placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />

              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                <Text style={styles.loginText}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.googleBtn} onPress={() => promptAsync()}>
                <View style={styles.googleContent}>
                  <AntDesign name="google" size={20} color="#4285F4" />
                  <Text style={styles.googleText}>Entrar com Google</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/cadastroUsuarioScreen')}>
                <Text style={styles.register}>Cadastre-se</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/Rota_RecuperarSenhaScreen')}>
                <Text style={styles.forgot}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            </Animatable.View>
          )}
          {!loading && (
          <Text style={styles.footer}>© 2025 - Fraternidade Bezerra de Menezes</Text>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: width * 0.05,
  },
  logo: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 20,
    paddingTop: height * 0.45,
  },
  formBox: {
    width: '100%',
    paddingHorizontal: 10,
  },
  loginBtn: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DADCE0',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  googleText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  register: {
    marginTop: 10,
    color: '#007AFF',
    textAlign: 'center',
  },
  forgot: {
    marginTop: 8,
    color: '#007AFF',
    textAlign: 'center',
  },
  scrollContainer: {
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  footer: {
    marginTop: 30,
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
  },
  loadingOverlay: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
});
