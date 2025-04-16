import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import Input from '../components/input';
import { db } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function CadastroPessoaScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [endereco, setEndereco] = useState('');

  const handleCadastroPessoa = async () => {
    if (!nome || !email || !telefone || !dataNascimento || !endereco) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      await addDoc(collection(db, 'bzmpessoa'), {
        nome,
        email,
        telefone,
        dataNascimento,
        endereco,
        idPessoa: Date.now(),
        criadoEm: new Date(),
      });

      Alert.alert('Sucesso', 'Pessoa cadastrada com sucesso!');
      // limpar os campos
      setNome('');
      setEmail('');
      setTelefone('');
      setDataNascimento('');
      setEndereco('');
    } catch (error) {
      console.error('Erro ao cadastrar pessoa:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao cadastrar a pessoa.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cadastro de Pessoa</Text>

      <Input placeholder="Nome completo" value={nome} onChangeText={setNome} />
      <Input placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Input placeholder="Telefone com DDD" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
      <Input placeholder="Data de nascimento (DD/MM/AAAA)" value={dataNascimento} onChangeText={setDataNascimento} />
      <Input placeholder="Endereço completo" value={endereco} onChangeText={setEndereco} />

      <View style={styles.buttonContainer}>
        <Button title="Cadastrar Pessoa" onPress={handleCadastroPessoa} />
      </View>
    </ScrollView>
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
});
