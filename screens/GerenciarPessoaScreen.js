import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, getDocs, doc,query, where, updateDoc, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { getAuth } from 'firebase/auth';

const { width, height } = Dimensions.get('window');


export default function GerenciarPessoaScreen() {
  const [busca, setBusca] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [selecionada, setSelecionada] = useState(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [criadoEm, setCriadoEm] = useState('');
  const [perfilUsuario, setPerfilUsuario] = useState('');

  const buscarPessoas = async (texto) => {
    setBusca(texto);
    if (texto.length < 2) {
      setSugestoes([]);
      return;
    }

    try {
      const snapshot = await getDocs(collection(db, 'bzmpessoa'));
      const filtrados = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) => p.nome?.toUpperCase().includes(texto.toUpperCase()));
      setSugestoes(filtrados);
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error);
    }
  };

  const selecionarPessoa = (p) => {
    setSelecionada(p);
    setNome(p.nome || '');
    setEmail(p.email || '');
    setTelefone(p.telefone || '');
    setEndereco(p.endereco || '');
    setDataNascimento(p.dataNascimento || '');
    const dataConvertida =
    p.criadoEm && typeof p.criadoEm.toDate === 'function'
      ? p.criadoEm.toDate()
      : new Date(p.criadoEm);
  
  setCriadoEm(dataConvertida);
  
    setSugestoes([]);
  };

  const formatarDataNascimento = (texto) => {
    const numeros = texto.replace(/\D/g, '');
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4, 8)}`;
  };

  const validarDataNascimento = (data) => {
    if (!data || data.length !== 10) return false;
    const [dia, mes, ano] = data.split('/').map(Number);
    const d = new Date(ano, mes - 1, dia);
    return d && d.getDate() === dia && d.getMonth() === mes - 1 && d.getFullYear() === ano;
  };

  const salvarPessoa = async () => {

    if (perfilUsuario[0].perfil !== 'admin' && perfilUsuario[0].perfil !== 'ADMINISTRADOR') {
      Alert.alert('Acesso negado', 'Apenas administradores podem salvar pessoas.');
      return;
    }

    if (!nome || !email || !telefone || !dataNascimento) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    if (!validarDataNascimento(dataNascimento)) {
      Alert.alert('Atenção', 'Informe uma data de nascimento válida (dd/mm/aaaa).');
      return;
    }

    try {
      const dados = {
        nome,
        email,
        telefone,
        endereco,
        dataNascimento,
        criadoEm: selecionada?.criadoEm || new Date().toISOString(),
      };

      if (selecionada) {
        const ref = doc(db, 'bzmpessoa', selecionada.id);
        await updateDoc(ref, dados);
        Alert.alert('Sucesso', 'Pessoa atualizada!');
      } else {
        await addDoc(collection(db, 'bzmpessoa'), {
          ...dados,
          idPessoa: Date.now().toString(),
        });
        Alert.alert('Sucesso', 'Pessoa cadastrada!');
      }

      setBusca('');
      setNome('');
      setEmail('');
      setTelefone('');
      setEndereco('');
      setDataNascimento('');
      setSelecionada(null);
      setSugestoes([]);
    } catch (e) {
      console.error('Erro ao salvar pessoa:', e);
      Alert.alert('Erro', 'Não foi possível salvar.');
    }
  };

  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        const q = query(collection(db, 'bzmusuario'));
        const snapshot = await getDocs(q);

        const listaUsuarios = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPerfilUsuario(listaUsuarios);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarUsuarios();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 Cadastro de Pessoas</Text>

      <TextInput
        placeholder="Buscar pessoa pelo nome"
        value={busca}
        onChangeText={buscarPessoas}
        style={styles.input}
      />

      {sugestoes.length > 0 && (
        <View style={styles.listaSugestoes}>
          {sugestoes.map((p) => (
            <TouchableOpacity key={p.id} onPress={() => selecionarPessoa(p)} style={styles.sugestaoItem}>
              <Text>{p.nome}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selecionada && (
        <Text style={styles.criadoEm}>
        Criado em: {criadoEm instanceof Date ? criadoEm.toLocaleDateString('pt-BR') : ''}
      </Text>
      )}

      <TextInput placeholder="Nome" value={nome} onChangeText={setNome} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Telefone" value={telefone} onChangeText={setTelefone} style={styles.input} />
      <TextInput placeholder="Endereço" value={endereco} onChangeText={setEndereco} style={styles.input} />
      <TextInput
        placeholder="Data de Nascimento (dd/mm/aaaa)"
        value={dataNascimento}
        onChangeText={(text) => setDataNascimento(formatarDataNascimento(text))}
        keyboardType="numeric"
        style={styles.input}
      />

      <TouchableOpacity style={styles.botaoSalvar} onPress={salvarPessoa}>
        <MaterialIcons name="save" size={24} color="#fff" />
        <Text style={styles.botaoSalvarTexto}>Salvar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
    paddingTop: height * 0.1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  botaoSalvar: {
    backgroundColor: '#6A5ACD',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  botaoSalvarTexto: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  listaSugestoes: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    zIndex: 10,
    maxHeight: 150,
  },
  sugestaoItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  criadoEm: {
    marginBottom: 10,
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'right',
  },
});
