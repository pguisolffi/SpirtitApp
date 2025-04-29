import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function ContaScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [idDocUsuario, setIdDocUsuario] = useState(null);
  const [erroDataNascimento, setErroDataNascimento] = useState('');



  useEffect(() => {
    const carregarDados = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const q = query(collection(db, 'bzmusuario'), where('uid', '==', user.uid)); // <<<<<<<<<<
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          setUsuario(docData);
          setIdDocUsuario(snapshot.docs[0].id); // salva o id do documento para o update
          setIsAdmin(docData.perfil === 'Administrador');
        } else {
          console.error('Usuário não encontrado no Firestore.');
        }
      }
    };

    carregarDados();
  }, []);


  const handleSalvar = async () => {
    try {
      if (!idDocUsuario) {
        console.error('ID do documento do usuário não encontrado.');
        return;
      }

      const docRef = doc(db, 'bzmusuario', idDocUsuario);
      await updateDoc(docRef, usuario);
      Alert.alert('Sucesso', 'Dados atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      Alert.alert('Erro', 'Não foi possível salvar suas alterações.');
    }
  };

  const formatarDataNascimento = (texto) => {
    const somenteNumeros = texto.replace(/\D/g, '');

    let dataFormatada = somenteNumeros;

    if (somenteNumeros.length >= 3 && somenteNumeros.length <= 4) {
      dataFormatada = somenteNumeros.replace(/^(\d{2})(\d{1,2})$/, '$1/$2');
    } else if (somenteNumeros.length > 4 && somenteNumeros.length <= 8) {
      dataFormatada = somenteNumeros.replace(/^(\d{2})(\d{2})(\d{1,4})$/, '$1/$2/$3');
    }

    return dataFormatada;
  };


  const validarDataNascimento = (data) => {
    if (!data || data.length !== 10) return false; // Precisa ter 10 caracteres DD/MM/AAAA

    const [dia, mes, ano] = data.split('/').map(Number);

    if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return false;

    const dataObj = new Date(ano, mes - 1, dia); // Date aceita mês de 0 a 11
    return (
      dataObj.getFullYear() === ano &&
      dataObj.getMonth() === mes - 1 &&
      dataObj.getDate() === dia
    );
  };



  if (!usuario) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>

      <Text style={styles.title}>Minha Conta</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nome completo:</Text>
        <TextInput
          style={styles.input}
          value={usuario.nome}
          onChangeText={(text) => setUsuario({ ...usuario, nome: text })}
        />

        <Text style={styles.label}>Telefone:</Text>
        <TextInput
          style={styles.input}
          value={usuario.telefone}
          onChangeText={(text) => setUsuario({ ...usuario, telefone: text })}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Email:</Text>
        <TextInput
          style={[styles.input, { backgroundColor: '#e0e0e0' }]}
          value={usuario.email}
          editable={false}
        />

        <Text style={styles.label}>Endereço:</Text>
        <TextInput
          style={styles.input}
          value={usuario.endereco}
          onChangeText={(text) => setUsuario({ ...usuario, endereco: text })}
        />

        <Text style={styles.label}>Data de Nascimento:</Text>
        <TextInput
          style={[styles.input, erroDataNascimento ? { borderColor: 'red', borderWidth: 1 } : {}]}
          value={usuario.dtnascimento}
          onChangeText={(text) => {
            const dataFormatada = formatarDataNascimento(text);
            setUsuario({ ...usuario, dtnascimento: dataFormatada });

            if (dataFormatada.length === 10) {
              if (!validarDataNascimento(dataFormatada)) {
                setErroDataNascimento('Data de nascimento inválida.');
              } else {
                setErroDataNascimento('');
              }
            } else {
              setErroDataNascimento('');
            }
          }}
          keyboardType="numeric"
          placeholder="DD/MM/AAAA"
        />

        {erroDataNascimento ? (
          <Text style={styles.errorText}>{erroDataNascimento}</Text>
        ) : null}



      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Perfil e Permissões</Text>

        <Text style={styles.label}>Perfil:</Text>
        <TextInput
          style={styles.input}
          value={usuario.perfil}
          editable={isAdmin}
          onChangeText={(text) => setUsuario({ ...usuario, perfil: text })}
        />

        <Text style={styles.label}>Permissões:</Text>
        <TextInput
          style={styles.input}
          value={Array.isArray(usuario.permissoes) ? usuario.permissoes.join(', ') : usuario.permissoes}
          editable={isAdmin}
          onChangeText={(text) => setUsuario({ ...usuario, permissoes: text.split(',').map(p => p.trim()) })}
          placeholder="Ex: atendimento, eventos"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSalvar}>
        <Text style={styles.saveButtonText}>Salvar Alterações</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: width * 0.05,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: width * 0.05,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#444',
  },
  label: {
    marginBottom: 5,
    color: '#555',
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#6A5ACD',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: -10,
    marginBottom: 10,
    fontSize: 12,
  },
 
});
