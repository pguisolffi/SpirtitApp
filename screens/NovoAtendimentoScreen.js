// NovoAtendimento.js (versão melhorada)

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  FlatList,
  LayoutAnimation,
  Alert,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db } from './firebaseConfig';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function NovoAtendimento() {
  const router = useRouter();
  const [historico, setHistorico] = useState([]);
  const [mostrarHistoricoCompleto, setMostrarHistoricoCompleto] = useState(false);
  const [novaQueixa, setNovaQueixa] = useState('');
  const [sala, setSala] = useState('');
  const [buscaPaciente, setBuscaPaciente] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const salas = ['Maca', 'Passe', 'Fraterno'];

  const buscarPacientes = async (texto) => {
    setBuscaPaciente(texto);
    if (texto.length < 2) {
      setSugestoes([]);
      setHistorico([]);
      return;
    }
    const colRef = collection(db, 'bzmpessoa');
    const q = query(colRef, where('nome', '>=', texto), where('nome', '<=', texto + '\uf8ff'));
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
    buscarHistoricoDoPaciente(paciente.idPessoa);
  };

  const buscarHistoricoDoPaciente = async (idPessoa) => {
    try {
      const colRef = collection(db, 'bzmAtendimentoHist');
      const historicoQuery = query(colRef, where('id_paciente', '==', idPessoa));
      const snapshot = await getDocs(historicoQuery);
  
      const historicoFormatado = snapshot.docs.map((doc, index) => {
        const dados = doc.data();
        const dataFormatada = new Date(dados.data_hora?.seconds * 1000).toLocaleDateString('pt-BR');
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
    if (!buscaPaciente.trim() || !novaQueixa.trim() || !sala || !selecionado) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
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
      };
  
      await addDoc(collection(db, 'bzmAtendimentoHist'), novoAtendimento);
  
      Alert.alert('Sucesso', 'Atendimento salvo com sucesso!');
      setNovaQueixa('');
      setSala('');
      setSelecionado(null);
      setBuscaPaciente('');
      setHistorico([]);
    } catch (error) {
      console.error('Erro ao salvar atendimento:', error);
      Alert.alert('Erro', 'Não foi possível salvar o atendimento.');
    }
  };
  
  
  return (
    <FlatList
      data={[{}]} // valor fictício só para manter o FlatList vivo
      keyExtractor={(_, index) => index.toString()}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.container}>
          <View style={styles.topo}>
            <MaterialIcons name="healing" size={26} color="#5A90E0" />
            <Text style={styles.title}>Atendimento Espiritual</Text>
          </View>
  
          <TextInput
            style={styles.input}
            placeholder="Pesquise pelo nome ou nascimento"
            value={buscaPaciente}
            onChangeText={buscarPacientes}
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
              onPress={() => router.push('/Rota_CadastroPessoaScreen')}
            >
              <MaterialIcons name="person-add" size={20} color="#fff" />
              <Text style={styles.textoCadastro}>Cadastrar nova pessoa</Text>
            </TouchableOpacity>
          )}
  
          <TextInput
            style={[styles.input, styles.novaQueixa]}
            placeholder="Insira o motivo da sua visita hoje..."
            multiline
            value={novaQueixa}
            onChangeText={setNovaQueixa}
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
  
          <Text style={styles.subTitle}>Sala</Text>
          <View style={styles.salaContainer}>
            {salas.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.salaButton, sala === item && styles.salaButtonSelected]}
                onPress={() => setSala(item)}>
                <Text style={[styles.salaButtonText, sala === item && styles.salaButtonTextSelected]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
      renderItem={null} // 👈 não precisa renderizar itens reais
      ListFooterComponent={
        <View style={[styles.buttonContainer, { paddingHorizontal: width * 0.05, marginBottom: 40 }]}>
          <TouchableOpacity style={styles.button} onPress={handleSalvarAtendimento}>
            <Text style={styles.buttonText}>Salvar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      }
    />
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
  }
});
