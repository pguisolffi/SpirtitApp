import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Input from '../components/input';
import { db } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { width, height } from '../constants/Layout';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import ScreenWrapper from '../components/ScreenWrapper';

export default function CadastroPessoaScreen() {
  const params = useLocalSearchParams();
  const [nome, setNome] = useState(params.nome ? String(params.nome) : '');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [endereco, setEndereco] = useState('');

  const [erroNome, setErroNome] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setToastVisible(false);
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

  const handleCadastroPessoa = async () => {
    if (!nome.trim()) {
      setErroNome(true);
      triggerShake();
      return;
    }

    try {
      await addDoc(collection(db, 'bzmpessoa'), {
        nome: nome.trim().toUpperCase(),
        email: email ? email.toLowerCase().trim() : '',
        telefone: telefone ? telefone.replace(/\D/g, '') : '',
        dataNascimento: dataNascimento ? dataNascimento.trim() : '',
        endereco: endereco ? endereco.trim() : '',
        idPessoa: Date.now(),
        criadoEm: new Date(),
      });

      showToast('Pessoa cadastrada com sucesso!');
      // limpar os campos
      setNome('');
      setEmail('');
      setTelefone('');
      setDataNascimento('');
      setEndereco('');
      setErroNome(false);
    } catch (error) {
      console.error('Erro ao cadastrar pessoa:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao cadastrar a pessoa.');
    }
  };

  return (
    <ScreenWrapper title="Cadastro de Pessoa">
      <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
        <Input 
          placeholder="Nome completo *" 
          value={nome} 
          onChangeText={(text) => {
            setNome(text);
            if (text) setErroNome(false);
          }} 
          style={erroNome && styles.inputErro}
        />
        <Input placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Input placeholder="Telefone com DDD" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
        <Input placeholder="Data de nascimento (DD/MM/AAAA)" value={dataNascimento} onChangeText={setDataNascimento} />
        <Input placeholder="Endereço completo" value={endereco} onChangeText={setEndereco} />
      </Animated.View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.botaoSalvar} onPress={handleCadastroPessoa}>
          <Text style={styles.botaoTexto}>Cadastrar Pessoa</Text>
        </TouchableOpacity>
      </View>

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
    padding: width * 0.05,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
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
  botaoSalvar: {
    backgroundColor: '#5A90E0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
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
});
