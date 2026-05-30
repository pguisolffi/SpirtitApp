// NovoAtendimento.js (versão melhorada)

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  LayoutAnimation,
  Alert,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db } from './firebaseConfig';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { width, height } from '../constants/Layout';

import ScreenWrapper from '../components/ScreenWrapper';

export default function NovoAtendimento() {
  const router = useRouter();
  const [historico, setHistorico] = useState([]);
  const [mostrarHistoricoCompleto, setMostrarHistoricoCompleto] = useState(false);
  const [novaQueixa, setNovaQueixa] = useState('');
  const [sala, setSala] = useState('');
  const [buscaPaciente, setBuscaPaciente] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [erros, setErros] = useState({ buscaPaciente: false, novaQueixa: false, sala: false });
  const salas = ['Maca', 'Passe', 'Fraterno'];

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;

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

  const buscarPacientes = async (texto) => {
    setBuscaPaciente(texto);
    if (texto.length < 2) {
      setSugestoes([]);
      setHistorico([]);
      return;
    }
  
    const colRef = collection(db, 'bzmpessoa');
    const nomeNormalizado = texto.trim().toUpperCase(); // 🔥 aqui!
    const q = query(
      colRef,
      where('nome', '>=', nomeNormalizado),
      where('nome', '<=', nomeNormalizado + '\uf8ff')
    );
  
    try {
      const snapshot = await getDocs(q);
      const pacientes = snapshot.docs.map(doc => ({ id: doc.id, idPessoa: doc.data().idPessoa, ...doc.data() }));
      setSugestoes(pacientes);
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
    }
  };
  

  const selecionarPaciente = (paciente) => {
    setBuscaPaciente(paciente.nome);
    setSelecionado(paciente);
    setSugestoes([]);
    setErros((prev) => ({ ...prev, buscaPaciente: false }));
    buscarHistoricoDoPaciente(paciente.idPessoa);
  };

  const buscarHistoricoDoPaciente = async (idPessoa) => {
    try {
      const colRef = collection(db, 'bzmAtendimentoHist');
      const historicoQuery = query(colRef, where('id_paciente', '==', idPessoa));
      const snapshot = await getDocs(historicoQuery);
  
      const docsOrdenados = [...snapshot.docs].sort((a, b) => {
        const tA = a.data().data_hora?.seconds || 0;
        const tB = b.data().data_hora?.seconds || 0;
        return tB - tA;
      });

      const historicoFormatado = docsOrdenados.map((doc, index) => {
        const dados = doc.data();
        const dataFormatada = dados.data_hora
          ? new Date(dados.data_hora.seconds * 1000).toLocaleDateString('pt-BR')
          : 'Data não registrada';
        return {
          id: index + 1,
          queixa: dados.queixa,
          resposta: dados.orientacao_recebida,
          data: dataFormatada,
        };
      });
  
      setHistorico(historicoFormatado);
    } catch (error) {
      console.error('Erro ao buscar histórico do paciente:', error);
    }
  };
  
  

  const handleSalvarAtendimento = async () => {
    const novosErros = {
      buscaPaciente: !buscaPaciente.trim() || !selecionado,
      novaQueixa: !novaQueixa.trim(),
      sala: !sala,
    };
    setErros(novosErros);

    if (novosErros.buscaPaciente || novosErros.novaQueixa || novosErros.sala) {
      triggerShake();
      return;
    }
  
    try {
      // Verifica se já existe um atendimento "Aguardando"
      const colRef = collection(db, 'bzmAtendimentoHist');
      const q = query(colRef, where('id_paciente', '==', selecionado.idPessoa), where('status', '==', 'aguardando'));
      const snapshot = await getDocs(q);
  
      if (!snapshot.empty) {
        Alert.alert('Atenção', 'Este paciente já possui um atendimento com status "aguardando".');
        return;
      }
  
      // Se não houver duplicidade, salva
      const novoAtendimento = {
        data_hora: Timestamp.now(),
        id_paciente: selecionado.idPessoa,
        orientacao_recebida: '',
        orientador: '',
        queixa: novaQueixa,
        sala_atendida: sala,
        status: 'aguardando',
        prioridade: '#4CAF50',
      };
  
      await addDoc(collection(db, 'bzmAtendimentoHist'), novoAtendimento);
  
      showToast('Atendimento salvo com sucesso!');
      setNovaQueixa('');
      setSala('');
      setSelecionado(null);
      setBuscaPaciente('');
      setHistorico([]);
      setErros({ buscaPaciente: false, novaQueixa: false, sala: false });
    } catch (error) {
      console.error('Erro ao salvar atendimento:', error);
      Alert.alert('Erro', 'Não foi possível salvar o atendimento.');
    }
  };
  
  return (
    <ScreenWrapper title="Atendimento Espiritual" scrollable={true}>
      <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
        <TextInput
          style={[styles.input, erros.buscaPaciente && styles.inputErro]}
          placeholder="Pesquise pelo nome ou nascimento *"
          value={buscaPaciente}
          onChangeText={(text) => {
            buscarPacientes(text);
            if (text) setErros((prev) => ({ ...prev, buscaPaciente: false }));
          }}
        />

        {/* 🔁 Renderiza sugestões manualmente */}
        {sugestoes.length > 0 && (
          <View style={styles.listaSugestoes}>
            {sugestoes.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => selecionarPaciente(item)}
                style={styles.sugestaoItem}
              >
                <Text>{item.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {buscaPaciente.length > 2 && sugestoes.length === 0 && !selecionado && (
          <TouchableOpacity
            style={styles.botaoCadastroSugestao}
            onPress={() => router.push({
              pathname: '/Rota_CadastroPessoaScreen',
              params: { nome: buscaPaciente }
            })}
          >
            <MaterialIcons name="person-add" size={20} color="#fff" />
            <Text style={styles.textoCadastro}>Cadastrar nova pessoa</Text>
          </TouchableOpacity>
        )}

        <TextInput
          style={[styles.input, styles.novaQueixa, erros.novaQueixa && styles.inputErro]}
          placeholder="Insira o motivo da sua visita hoje... *"
          multiline
          value={novaQueixa}
          onChangeText={(text) => {
            setNovaQueixa(text);
            if (text) setErros((prev) => ({ ...prev, novaQueixa: false }));
          }}
        />

        <View style={styles.historicoContainer}>
          <Text style={styles.subTitle}>Histórico</Text>
          {(mostrarHistoricoCompleto ? historico : historico.slice(0, 2)).map((item) => (
            <View key={item.id} style={styles.historicoItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="history" size={18} color="#999" style={{ marginRight: 8 }} />
                <Text style={styles.historicoText}>{item.queixa}</Text>
              </View>
              <Text style={styles.historicoData}>{item.data}</Text>
              {item.resposta && <Text style={styles.respostaText}>{item.resposta}</Text>}
            </View>
          ))}
          {historico.length > 2 && (
            <TouchableOpacity
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setMostrarHistoricoCompleto(!mostrarHistoricoCompleto);
              }}>
              <Text style={styles.verMais}>
                {mostrarHistoricoCompleto ? 'Ver menos' : 'Ver mais'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.subTitle, erros.sala && { color: '#DC5C5C' }]}>Sala *</Text>
        <View style={[styles.salaContainer, erros.sala && styles.salaContainerErro]}>
          {salas.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.salaButton, sala === item && styles.salaButtonSelected]}
              onPress={() => {
                setSala(item);
                setErros((prev) => ({ ...prev, sala: false }));
              }}>
              <Text style={[styles.salaButtonText, sala === item && styles.salaButtonTextSelected]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <View style={[styles.buttonContainer, { marginBottom: 40 }]}>
        <TouchableOpacity style={styles.button} onPress={handleSalvarAtendimento}>
          <Text style={styles.buttonText}>Salvar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
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
    paddingTop: height * 0.1,
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: width * 0.05
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: height * 0.03
  },
  title: {
    fontSize: width * 0.055,
    fontWeight: 'bold',
    color: '#5A90E0',
  },
  input: {
    backgroundColor: '#f7f9fc',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: height * 0.02
  },
  novaQueixa: {
    height: height * 0.12,
    textAlignVertical: 'top'
  },
  sugestaoItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  listaSugestoes: {
    maxHeight: 150,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15
  },
  historicoContainer: {
    marginBottom: height * 0.03
  },
  subTitle: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  historicoItem: {
    padding: width * 0.04,
    backgroundColor: '#f0f0f0',
    marginBottom: height * 0.015,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  historicoText: {
    fontSize: width * 0.04,
    color: '#333'
  },
  historicoData: {
    fontSize: width * 0.033,
    color: '#888',
    marginTop: 4
  },
  respostaText: {
    fontSize: width * 0.037,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 4
  },
  verMais: {
    color: '#5A90E0',
    fontSize: width * 0.04,
    marginTop: height * 0.01,
    textAlign: 'right'
  },
  salaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: height * 0.03
  },
  salaButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 20
  },
  salaButtonSelected: {
    backgroundColor: '#5A90E0',
  },
  salaButtonText: {
    fontSize: width * 0.04,
    color: '#5A90E0'
  },
  salaButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: height * 0.02
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#5A90E0',
    marginHorizontal: 5,
    alignItems: 'center'
  },
  cancelButton: {
    borderColor: '#DC5C5C',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: width * 0.045,
    color: '#5A90E0'
  },
  botaoCadastroSugestao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5A90E0', // Azul suave
    padding: 12,
    borderRadius: 8,
    marginTop: 10
  },
  textoCadastro: {
    color: '#fff',
    fontSize: width * 0.04,
    fontWeight: 'bold',
    marginLeft: 8
  },
  cancelButtonText: {
    fontWeight: 'bold',
    fontSize: width * 0.045,
    color: '#DC5C5C'
  },
  inputErro: {
    borderColor: '#DC5C5C',
    borderWidth: 1.5,
  },
  salaContainerErro: {
    borderWidth: 1,
    borderColor: '#DC5C5C',
    borderRadius: 8,
    padding: 6,
  },
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: '10%',
    right: '10%',
    backgroundColor: '#2e7d32', // Verde escuro elegante
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
  }
});
