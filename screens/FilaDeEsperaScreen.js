import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { useEffect, useRef  } from 'react';
import { collection, query, where, getDocs,doc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; 

const { width, height } = Dimensions.get('window');
const salas = ['Maca', 'Passe', 'Fraterno'];

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CustomSalaSelector = ({ selectedIndex, onChange }) => {
  const labels = ['Todos', ...salas];
  const icons = ['users', 'bed', 'hand-paper-o', 'handshake-o'];

  const handlePress = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange(index);
  };

  return (
    <View style={styles.selectorWrapper}>
      <Text style={styles.screenTitle}>Fila de Espera</Text>

      <View style={styles.salaSelectorContainer}>
        {labels.map((label, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.salaButton,
              selectedIndex === index && styles.salaButtonSelected,
            ]}
            onPress={() => handlePress(index)}
          >
            <Icon
              name={icons[index]}
              size={16}
              color={selectedIndex === index ? '#fff' : '#555'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.salaButtonText,
                selectedIndex === index && styles.salaButtonTextSelected,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const WaitingQueue = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedCard, setExpandedCard] = useState(null);
  const [historicoModalVisible, setHistoricoModalVisible] = useState(false);
  const [historicoPaciente, setHistoricoPaciente] = useState([]);
  const [orientacaoModalVisible, setOrientacaoModalVisible] = useState(false);
  const [orientacaoTexto, setOrientacaoTexto] = useState('');
  const [orientadorSelecionado, setOrientadorSelecionado] = useState('');
  const voluntariosMock = ['João', 'Maria', 'José'];
  const [animatingCardId, setAnimatingCardId] = useState(null);
  const animation = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);


  const onRefresh = async () => {
    setRefreshing(true);
    await buscarPacientesAguardando(); // sua função já existente
    setRefreshing(false);
  };
  


  const buscarHistorico = async (idPaciente) => {
    try {
      const colRef = collection(db, 'bzmAtendimentoHist');
      const q = query(colRef, where('id_paciente', '==', idPaciente));
      const snapshot = await getDocs(q);
  
      const historico = snapshot.docs.map((doc, index) => {
        const dados = doc.data();
        const dataFormatada = new Date(dados.data_hora?.seconds * 1000).toLocaleDateString('pt-BR');
        return {
          id: index + 1,
          queixa: dados.queixa,
          resposta: dados.orientacao_recebida,
          data: dataFormatada,
        };
      });
  
      setHistoricoPaciente(historico);
      setHistoricoModalVisible(true);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      Alert.alert('Erro', 'Não foi possível carregar o histórico.');
    }
  };
  

  useEffect(() => {
    const buscarPacientesAguardando = async () => {
      try {
        const colRef = collection(db, 'bzmAtendimentoHist');
        const q = query(colRef, where('status', '==', 'aguardando'));
        const snapshot = await getDocs(q);
  
        const atendimentos = snapshot.docs.map((doc) => ({
          id: doc.id,
          id_paciente: doc.data().id_paciente,
          room: doc.data().sala_atendida || '',
          priorityColor: doc.data().prioridade || '#FFF',
        }));
  
        // Agora busca os dados da pessoa na coleção 'bzmpessoa'
        const pacientesCompletos = await Promise.all(
          atendimentos.map(async (at) => {
            try {
              const pessoaSnap = await getDocs(
                query(collection(db, 'bzmpessoa'), where('idPessoa', '==', at.id_paciente))
              );
  
              if (!pessoaSnap.empty) {
                const pessoa = pessoaSnap.docs[0].data();
                return {
                  ...at,
                  name: pessoa.nome || 'Paciente',
                  birthDate: pessoa.dataNascimento || '--/--/----',
                };
              } else {
                return {
                  ...at,
                  name: 'Paciente não encontrado',
                  birthDate: '--/--/----',
                };
              }
            } catch (error) {
              console.error('Erro ao buscar dados do paciente:', error);
              return {
                ...at,
                name: 'Erro ao buscar nome',
                birthDate: '--/--/----',
              };
            }
          })
        );
  
        setPatients(pacientesCompletos);
      } catch (error) {
        console.error('Erro ao buscar pacientes aguardando:', error);
      }
    };

    buscarPacientesAguardando();

    const interval = setInterval(() => {
      buscarPacientesAguardando(); // sua função já existente
    }, 300000); 
  
    return () => clearInterval(interval);
  

  }, []);
  
  

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setModalVisible(true);
  };

  const handleSave = () => {
    setPatients((prev) =>
      prev.map((p) => (p.id === selectedPatient.id ? selectedPatient : p))
    );
    setModalVisible(false);
  };

  const handleRoomChange = (room) => {
    if (!selectedPatient) return;
    const updatedPatient = { ...selectedPatient, room };
    setPatients((prev) =>
      prev.map((p) => (p.id === selectedPatient.id ? updatedPatient : p))
    );
    setSelectedPatient(updatedPatient);
    setRoomModalVisible(false);
  };

  const handleTabChange =async  (index) => {
    setSelectedIndex(index);
    setRefreshing(true);
    await buscarPacientesAguardando();
    setRefreshing(false);
  };

  const handleShowHistory = (patientId) => {
    alert(`Histórico de atendimentos para o paciente ${patientId}`);
  };

  const handleColorChange = (color) => {
    if (!selectedPatient) return;
    const updatedPatient = { ...selectedPatient, priorityColor: color };
    setPatients((prev) =>
      prev.map((p) => (p.id === selectedPatient.id ? updatedPatient : p))
    );
    setSelectedPatient(updatedPatient);
    setColorModalVisible(false);
  };

  const filteredPatients =
    selectedIndex === 0
      ? patients
      : patients.filter((p) => p.room === salas[selectedIndex - 1]);

  const renderItem = ({ item, drag, isActive }) => {
    const position =  filteredPatients.filter((p) => p.room === item.room).findIndex((p) => p.id === item.id) + 1;
    const isAnimating = animatingCardId === item.id;

    return (
      <TouchableOpacity
      style={[
        styles.card,
        {
          borderColor: item.priorityColor,
          borderLeftWidth: 6,
          opacity: isActive ? 0.5 : 1,
          backgroundColor: '#fff',
          transform: isAnimating ? [{ translateX: 10 }] : [],
        },
      ]}
        onLongPress={drag}
        onPress={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
      >
{isAnimating && (
  <Animated.View
    style={{
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      backgroundColor: '#d0f5d0',
      width: animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
      }),
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
    }}
  />
)}


        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.positionText}>#{position}</Text>
        </View>
        <Text style={styles.cardSubText}>Nascimento: {item.birthDate}</Text>
        <Text style={[styles.cardSubText, { fontWeight: 'bold' }]}>{item.room}</Text>

        {expandedCard === item.id && (
          <View style={styles.cardActions}>
<TouchableOpacity
  onPress={() => {
    setSelectedPatient(item);
    setOrientacaoTexto(item.orientacao_recebida || '');
    setOrientadorSelecionado(item.orientador || '');
    setOrientacaoModalVisible(true);
  }}
  style={styles.actionButton}
>
  <Icon name="pencil" size={18} color="#fff" />
</TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setSelectedPatient(item);
                setRoomModalVisible(true);
              }}
              style={styles.actionButton}
            >
              <Icon name="exchange" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
  onPress={() => buscarHistorico(item.id_paciente)}
  style={styles.actionButton}
>
  <Icon name="eye" size={18} color="#fff" />
</TouchableOpacity>
            <TouchableOpacity
  onPress={() => {
    setSelectedPatient(item);
    setColorModalVisible(true);
  }}
  style={styles.actionButton}
>
  <Icon name="paint-brush" size={18} color="#fff" />
</TouchableOpacity>

          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CustomSalaSelector selectedIndex={selectedIndex} onChange={handleTabChange} />
      <DraggableFlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => {
          setPatients((prevPatients) => {
            if (selectedIndex === 0) {
              return data; // Se está em "Todos", atualiza tudo
            }
        
            const salaSelecionada = salas[selectedIndex - 1];
        
            // Filtra os que estão em outras salas
            const foraDaSala = prevPatients.filter((p) => p.room !== salaSelecionada);
        
            // Junta os que não mudaram + os reordenados da sala atual
            return [...foraDaSala, ...data];
          });
        refreshing={refreshing}
        onRefresh={onRefresh}
        }}
        
      />
     

     <Modal
  visible={roomModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setRoomModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Selecione uma Sala</Text>

      <View style={{ width: '100%' }}>
        {salas.map((sala, index) => {
          const icons = ['bed', 'hand-paper-o', 'handshake-o'];
          return (
            <TouchableOpacity
              key={sala}
              style={styles.salaOptionButton}
              onPress={() => handleRoomChange(sala)}
            >
              <Icon name={icons[index]} size={18} color="#555" style={{ marginRight: 12 }} />
              <Text style={styles.salaOptionText}>{sala}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity onPress={() => setRoomModalVisible(false)} style={styles.modalCloseButton}>
        <Text style={styles.modalCloseText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>




      <Modal
  visible={colorModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setColorModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Escolher prioridade</Text>

      <View style={styles.colorOptions}>
        {['#FFD700', '#FF6347', '#90EE90', '#87CEFA', '#FFFFFF'].map((color) => (
          <TouchableOpacity
            key={color}
            style={[styles.colorCircle, { backgroundColor: color }]}
            onPress={() => handleColorChange(color)}
          />
        ))}
      </View>

      <TouchableOpacity onPress={() => setColorModalVisible(false)} style={styles.modalCloseButton}>
        <Text style={styles.modalCloseText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

<Modal
  visible={historicoModalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setHistoricoModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContainer, { alignItems: 'flex-start' }]}>
      <Text style={styles.modalTitle}>Histórico do Paciente</Text>

      <ScrollView style={{ maxHeight: height * 0.5, width: '100%' }}>
        {historicoPaciente.length === 0 ? (
          <Text style={{ color: '#666' }}>Nenhum atendimento anterior registrado.</Text>
        ) : (
          historicoPaciente.map((item) => (
            <View key={item.id} style={styles.historicoItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="history" size={16} color="#888" style={{ marginRight: 8 }} />
                <Text style={styles.historicoText}>{item.queixa}</Text>
              </View>
              {item.resposta && <Text style={styles.respostaText}>↳ {item.resposta}</Text>}
              <Text style={styles.historicoData}>{item.data}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        onPress={() => setHistoricoModalVisible(false)}
        style={[styles.modalCloseButton, { alignSelf: 'center', marginTop: 16 }]}
      >
        <Text style={styles.modalCloseText}>Fechar</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

<Modal
  visible={orientacaoModalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setOrientacaoModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Orientação Recebida</Text>

      <TextInput
        placeholder="Escreva a orientação..."
        value={orientacaoTexto}
        onChangeText={setOrientacaoTexto}
        multiline
        style={[styles.input, { height: 100, textAlignVertical: 'top', width: '100%' }]}
      />

      <Text style={{ marginTop: 12, marginBottom: 6 }}>Orientador:</Text>
      {voluntariosMock.map((nome) => (
        <TouchableOpacity
          key={nome}
          style={[
            styles.salaOptionButton,
            orientadorSelecionado === nome && { backgroundColor: '#d0e7ff' },
          ]}
          onPress={() => setOrientadorSelecionado(nome)}
        >
          <Text style={styles.salaOptionText}>{nome}</Text>
        </TouchableOpacity>
      ))}

      <View style={{ flexDirection: 'row', marginTop: 20, gap: 10 }}>
        <TouchableOpacity
          onPress={() => setOrientacaoModalVisible(false)}
          style={[styles.modalCloseButton, { flex: 1 }]}
        >
          <Text style={styles.modalCloseText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
onPress={async () => {
  if (!orientacaoTexto.trim() || !orientadorSelecionado) {
    Alert.alert('Atenção', 'Preencha a orientação e selecione o orientador.');
    return;
  }

  try {
    const docRef = doc(db, 'bzmAtendimentoHist', selectedPatient.id);

    await updateDoc(docRef, {
      orientacao_recebida: orientacaoTexto,
      orientador: orientadorSelecionado,
      status: 'atendido',
    });

    setAnimatingCardId(selectedPatient.id);
LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

setAnimatingCardId(selectedPatient.id);

Animated.timing(animation, {
  toValue: 1,
  duration: 1200,
  useNativeDriver: false,
}).start(() => {
  setPatients((prev) => prev.filter((p) => p.id !== selectedPatient.id));
  setOrientacaoModalVisible(false);
  setAnimatingCardId(null);
  animation.setValue(0); // Reset para outros cards
});



    // Atualiza localmente também
    const atualizado = {
      ...selectedPatient,
      orientacao_recebida: orientacaoTexto,
      orientador: orientadorSelecionado,
      status: 'atendido',
    };

    setPatients((prev) =>
      prev.map((p) => (p.id === selectedPatient.id ? atualizado : p))
    );

    setOrientacaoModalVisible(false);
  } catch (error) {
    console.error('Erro ao atualizar atendimento:', error);
    Alert.alert('Erro', 'Não foi possível salvar o atendimento.');
  }
}}

          style={[styles.modalCloseButton, { flex: 1, backgroundColor: '#4CAF50' }]}
        >
          <Text style={[styles.modalCloseText, { color: '#fff' }]}>Salvar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: height * 0.1,
    flex: 1,
    paddingHorizontal: width * 0.00,
    paddingBottom: height * 0.02,
  },
  selectorWrapper: {
    marginBottom: height * 0.02,
  },
  screenTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    marginBottom: height * 0.015,
    textAlign: 'center',
    color: '#333',
  },
  salaSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 100,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  salaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.035,
    borderRadius: 100,
    backgroundColor: '#eee',
  },
  salaButtonSelected: {
    backgroundColor: '#6A5ACD',
  },
  salaButtonText: {
    fontSize: width * 0.035,
    fontWeight: '600',
    color: '#555',
  },
  salaButtonTextSelected: {
    color: '#fff',
  },
  card: {
    padding: width * 0.04,
    marginBottom: height * 0.015,
    borderRadius: width * 0.03,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardName: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  positionText: {
    fontSize: width * 0.04,
    color: '#888',
  },
  cardSubText: {
    fontSize: width * 0.035,
    color: '#555',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: height * 0.01,
  },
  actionButton: {
    padding: width * 0.025,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  colorOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#ccc',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#333',
  },

  salaOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  salaOptionText: {
    fontSize: width * 0.04,
    color: '#333',
    fontWeight: '500',
  },
  

  /* Modal do Histórico*/
  historicoItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  historicoText: {
    fontSize: width * 0.04,
    fontWeight: 'bold',
    color: '#333',
  },
  respostaText: {
    fontSize: width * 0.037,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 4,
  },
  historicoData: {
    fontSize: width * 0.035,
    color: '#888',
    marginTop: 4,
  },
  
  
});

export default WaitingQueue;
