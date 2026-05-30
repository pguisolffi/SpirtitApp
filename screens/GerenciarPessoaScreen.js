import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
  Platform,
  Modal,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, query, where, updateDoc, addDoc, deleteDoc, limit, orderBy } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { height } from '../constants/Layout';

import ScreenWrapper from '../components/ScreenWrapper';
import { podeGerenciarModulo } from '../constants/Perfis';

const Avatar = ({ nome }) => {
  const inicial = nome ? nome.charAt(0).toUpperCase() : '?';
  const cores = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
  const corHash = nome ? nome.length % cores.length : 0;
  const corFundo = cores[corHash];

  return (
    <View style={[styles.avatar, { backgroundColor: corFundo }]}>
      <Text style={styles.avatarTexto}>{inicial}</Text>
    </View>
  );
};

export default function GerenciarPessoaScreen() {
  const [busca, setBusca] = useState('');
  const [listaPessoas, setListaPessoas] = useState([]);
  const [selecionada, setSelecionada] = useState(null);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');

  const [perfilUsuario, setPerfilUsuario] = useState('');
  const [permissoesUsuario, setPermissoesUsuario] = useState([]);
  const [erroNome, setErroNome] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Animations & Toasts
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

  const recarregarListaInicial = async () => {
    try {
      const q = query(collection(db, 'bzmpessoa'), orderBy('nome'), limit(10));
      const snapshot = await getDocs(q);
      const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListaPessoas(result);
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error);
    }
  };

  const buscarPerfilUsuario = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, 'bzmusuario'), where('uid', '==', user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const dados = snapshot.docs[0].data();
        setPerfilUsuario(dados.perfil || '');
        setPermissoesUsuario(dados.permissoes);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
    }
  };

  useEffect(() => {
    recarregarListaInicial();
    buscarPerfilUsuario();
  }, []);

  const buscarPessoas = async (texto) => {
    setBusca(texto);
    if (!texto.trim()) {
      recarregarListaInicial();
      return;
    }

    try {
      const nomeNormalizado = texto.trim().toUpperCase();
      const q = query(
        collection(db, 'bzmpessoa'),
        where('nome', '>=', nomeNormalizado),
        where('nome', '<=', nomeNormalizado + '\uf8ff'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListaPessoas(result);
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
    setErroNome(false);
    setModalVisible(true);
  };

  const limparFormulario = () => {
    setSelecionada(null);
    setNome('');
    setEmail('');
    setTelefone('');
    setEndereco('');
    setDataNascimento('');
    setErroNome(false);
    setModalVisible(true);
  };

  const formatarDataNascimento = (texto) => {
    const numeros = texto.replace(/\D/g, '');
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4, 8)}`;
  };

  const validarDataNascimento = (data) => {
    if (!data) return true;
    if (data.length !== 10) return false;
    const [dia, mes, ano] = data.split('/').map(Number);
    const d = new Date(ano, mes - 1, dia);
    return d && d.getDate() === dia && d.getMonth() === mes - 1 && d.getFullYear() === ano;
  };

  const salvarPessoa = async () => {
    if (!podeGerenciarModulo(perfilUsuario, permissoesUsuario, 'pessoas')) {
      Alert.alert('Acesso negado', 'Você não tem permissão para gerenciar pessoas.');
      return;
    }

    if (!nome.trim()) {
      setErroNome(true);
      triggerShake();
      return;
    }

    if (dataNascimento && !validarDataNascimento(dataNascimento)) {
      Alert.alert('Atenção', 'Informe uma data de nascimento válida (dd/mm/aaaa) ou deixe o campo em branco.');
      return;
    }

    try {
      const dados = {
        nome: nome.trim().toUpperCase(),
        email: email ? email.toLowerCase().trim() : '',
        telefone: telefone ? telefone.replace(/\D/g, '') : '',
        endereco: endereco ? endereco.trim() : '',
        dataNascimento: dataNascimento ? dataNascimento.trim() : '',
        criadoEm: selecionada ? selecionada.criadoEm : new Date().toISOString(),
      };

      if (selecionada) {
        const ref = doc(db, 'bzmpessoa', selecionada.id);
        await updateDoc(ref, dados);
        showToast('Cadastro atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'bzmpessoa'), {
          ...dados,
          idPessoa: Date.now().toString(),
        });
        showToast('Pessoa cadastrada com sucesso!');
      }

      setModalVisible(false);
      limparFormulario();
      recarregarListaInicial();
    } catch (e) {
      console.error('Erro ao salvar pessoa:', e);
      Alert.alert('Erro', 'Não foi possível salvar o cadastro.');
    }
  };

  const excluirPessoa = async () => {
    if (!podeGerenciarModulo(perfilUsuario, permissoesUsuario, 'pessoas')) {
      Alert.alert('Acesso negado', 'Você não tem permissão para excluir pessoas.');
      return;
    }

    if (!selecionada) return;

    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir ${selecionada.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const ref = doc(db, 'bzmpessoa', selecionada.id);
              await deleteDoc(ref);
              showToast('Cadastro excluído com sucesso!');
              setModalVisible(false);
              limparFormulario();
              recarregarListaInicial();
            } catch (error) {
              console.error('Erro ao excluir pessoa:', error);
              Alert.alert('Erro', 'Não foi possível excluir.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper title="Gerenciar Pessoas" scrollable={true}>
      <View style={styles.mainContainer}>
        
        <View style={styles.headerBusca}>
          <View style={styles.buscaContainer}>
            <MaterialIcons name="search" size={22} color="#666" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Buscar pelo nome..."
              value={busca}
              onChangeText={buscarPessoas}
              style={styles.buscaInput}
            />
          </View>
          <TouchableOpacity 
            style={styles.botaoNovo} 
            onPress={limparFormulario}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.listaPessoasScroll} nestedScrollEnabled>
          {listaPessoas.length === 0 ? (
            <Text style={styles.listaVazia}>Nenhuma pessoa encontrada.</Text>
          ) : (
            listaPessoas.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.cardPessoa}
                onPress={() => selecionarPessoa(p)}
                activeOpacity={0.8}
              >
                <Avatar nome={p.nome} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardNome}>{p.nome}</Text>
                  {p.telefone ? (
                    <View style={styles.cardIconTextRow}>
                      <MaterialIcons name="phone" size={14} color="#666" style={{ marginRight: 4 }} />
                      <Text style={styles.cardSubText}>{p.telefone}</Text>
                    </View>
                  ) : null}
                  {p.email ? (
                    <View style={styles.cardIconTextRow}>
                      <MaterialIcons name="email" size={14} color="#666" style={{ marginRight: 4 }} />
                      <Text style={styles.cardSubText}>{p.email}</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* MODAL DE CADASTRAR/EDITAR PESSOA */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalFundo}>
          <Animated.View style={[styles.modalConteudo, { transform: [{ translateX: shakeAnimation }] }]}>
            
            <TouchableOpacity
              style={styles.botaoFecharModal}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>

            <Text style={styles.formTitulo}>
              {selecionada ? 'Editar Cadastro' : 'Cadastrar Nova Pessoa'}
            </Text>

            <TextInput
              placeholder="Nome completo *"
              value={nome}
              onChangeText={(text) => {
                setNome(text);
                if (text) setErroNome(false);
              }}
              style={[styles.formInput, erroNome && styles.inputErro]}
            />
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.formInput}
            />
            <TextInput
              placeholder="Telefone com DDD"
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
              style={styles.formInput}
            />
            <TextInput
              placeholder="Endereço completo"
              value={endereco}
              onChangeText={setEndereco}
              style={styles.formInput}
            />
            <TextInput
              placeholder="Data de Nascimento (dd/mm/aaaa)"
              value={dataNascimento}
              onChangeText={(text) => setDataNascimento(formatarDataNascimento(text))}
              keyboardType="numeric"
              style={styles.formInput}
            />

            <View style={styles.formBotoesContainer}>
              <TouchableOpacity style={styles.formBotaoSalvar} onPress={salvarPessoa}>
                <MaterialIcons name="save" size={20} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.formBotaoTexto}>Salvar</Text>
              </TouchableOpacity>

              {selecionada && (
                <TouchableOpacity style={styles.formBotaoExcluir} onPress={excluirPessoa}>
                  <MaterialIcons name="delete" size={20} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.formBotaoTexto}>Excluir</Text>
                </TouchableOpacity>
              )}
            </View>

            {selecionada && selecionada.criadoEm && (
              <Text style={styles.criadoEmText}>
                Cadastrado em: {new Date(selecionada.criadoEm).toLocaleDateString('pt-BR')}
              </Text>
            )}
          </Animated.View>
        </View>
      </Modal>

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
  mainContainer: {
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
    }),
  },
  headerBusca: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  buscaContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  buscaInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#334155',
  },
  botaoNovo: {
    backgroundColor: '#5A90E0',
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listaPessoasScroll: {
    maxHeight: height * 0.65,
    borderRadius: 12,
  },
  listaVazia: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 20,
    fontSize: 15,
    fontStyle: 'italic',
  },
  cardPessoa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexto: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
  },
  cardNome: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardIconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardSubText: {
    fontSize: 13,
    color: '#64748b',
  },
  modalFundo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalConteudo: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    position: 'relative',
    ...(Platform.OS === 'web' && {
      maxWidth: 450,
    }),
  },
  botaoFecharModal: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 20,
    padding: 4,
  },
  formTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    paddingRight: 24, // Para não sobrepor o X de fechar
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    color: '#334155',
  },
  inputErro: {
    borderColor: '#DC5C5C',
    borderWidth: 1.5,
  },
  formBotoesContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  formBotaoSalvar: {
    flex: 1,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  formBotaoExcluir: {
    flex: 1,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  formBotaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  criadoEmText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
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
