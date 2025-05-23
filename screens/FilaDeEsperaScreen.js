import React, { useState,useEffect, useRef } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome';
import DraggableFlatList from 'react-native-draggable-flatlist';
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
  const [showDropdown, setShowDropdown] = useState(false);
   const router = useRouter();




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
  

  useEffect(() => {
    

    buscarPacientesAguardando();

    const interval = setInterval(() => {
      buscarPacientesAguardando(); // sua função já existente
    }, 300000); 
  
    return () => clearInterval(interval);
  

  }, []);
  
  
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
      <View style={styles.wrapper}>
<View style={styles.topBar}>
  <TouchableOpacity
    onPress={() => router.push('/Rota_HomeFuncionario')}
    style={styles.backButton}
  >
    <Ionicons name="chevron-back" size={24} color="#333" />
  </TouchableOpacity>

  <Text style={styles.topBarTitle}>Fila de Espera</Text>
</View>

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

        }}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
     

     <Modal
  visible={roomModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setRoomModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={[
    styles.modalContainer,
    Platform.OS === 'web' && { width: '90%', maxWidth: 400 },
  ]}>
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
              <Icon   name={icons[index]}
  size={Platform.OS === 'web' ? 16 : 18}
  color="#555"
  style={{ marginRight: Platform.OS === 'web' ? 8 : 12 }} />
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
    <View
  style={[
    styles.modalContainer,
    {
      alignItems: 'flex-start',
      ...(Platform.OS === 'web' && { width: '90%', maxWidth: 500 }),
    },
  ]}>
      <Text style={styles.modalTitle}>Histórico do Paciente</Text>

      <ScrollView style={{ maxHeight: Platform.OS === 'web' ? 300 : height * 0.5, width: '100%' }}>
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

      <TouchableOpacity
  style={styles.dropdownButton}
  onPress={() => setShowDropdown(true)}
>
  <Text style={styles.dropdownButtonText}>
    {orientadorSelecionado ? `👤 ${orientadorSelecionado}` : 'Selecionar Orientador'}
  </Text>
</TouchableOpacity>


<Modal
  visible={showDropdown}
  transparent
  animationType="fade"
  onRequestClose={() => setShowDropdown(false)}
>
  <View style={styles.dropdownOverlay}>
    <View style={styles.dropdownContainer}>
      <Text style={styles.modalTitle}>Escolha o orientador</Text>
      {voluntariosMock.map((nome) => (
        <TouchableOpacity
          key={nome}
          onPress={() => {
            setOrientadorSelecionado(nome);
            setShowDropdown(false);
          }}
          style={styles.dropdownOption}
        >
          <Text style={styles.dropdownOptionText}>👤 {nome}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
</Modal>


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
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    justifyContent: 'center',
    padding: Platform.OS === 'web' ? 10 : width * 0.025,
  },

  backButton: {
    backgroundColor: '#fff',
    borderRadius: 100,
    elevation: 3,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: Platform.OS === 'web' ? 12 : width * 0.03,
    elevation: 1,
    marginBottom: Platform.OS === 'web' ? 16 : height * 0.015,
    padding: Platform.OS === 'web' ? 20 : width * 0.04,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    width: '100%',
  },

  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Platform.OS === 'web' ? 10 : 0,
    justifyContent: 'space-around',
    marginTop: height * 0.01,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cardName: {
    fontSize: Platform.OS === 'web' ? 18 : width * 0.045,
    fontWeight: 'bold',
  },

  cardSubText: {
    color: '#555',
    fontSize: Platform.OS === 'web' ? 15 : width * 0.035,
  },

  colorCircle: {
    borderColor: '#ccc',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    width: 40,
  },

  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },

  container: {
    alignItems: 'center',
    flex: 1,
    paddingBottom: Platform.OS === 'web' ? 24 : height * 0.02,
    paddingHorizontal: Platform.OS === 'web' ? 16 : width * 0.00,
    paddingTop: Platform.OS === 'web' ? 32 : height * 0.08,
  },

  dropdownButton: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },

  dropdownButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },

  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: height * 0.5,
    padding: 20,
    width: Platform.OS === 'web' ? 500 : '80%',
  },

  dropdownOption: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },

  dropdownOptionText: {
    color: '#333',
    fontSize: 16,
  },

  dropdownOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
    justifyContent: 'center',
  },

historicoData: {
  color: '#888',
  fontSize: Platform.OS === 'web' ? 14 : width * 0.035,
  marginTop: 4,
},


historicoItem: {
  backgroundColor: '#f5f5f5',
  borderRadius: 8,
  marginBottom: 10,
  padding: Platform.OS === 'web' ? 12 : 10,
},

historicoText: {
  color: '#333',
  fontSize: Platform.OS === 'web' ? 16 : width * 0.04,
  fontWeight: 'bold',
},


  input: {
  fontSize: Platform.OS === 'web' ? 16 : width * 0.04,
  padding: 12,
  backgroundColor: '#f9f9f9',
  borderRadius: 8,
  borderColor: '#ccc',
  borderWidth: 1,
  marginTop: 10,
},

modalCloseButton: {
  flex: 1,
  paddingVertical: Platform.OS === 'web' ? 12 : 8,
  paddingHorizontal: Platform.OS === 'web' ? 24 : 20,
  borderRadius: 6,
  backgroundColor: '#ccc',
  alignItems: 'center',
},

modalCloseText: {
  fontSize: Platform.OS === 'web' ? 16 : width * 0.04,
  color: '#333',
  fontWeight: '500',
},

  modalContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: Platform.OS === 'web' ? 600 : '80%',
  },

  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'center',
  },

modalTitle: {
  fontSize: Platform.OS === 'web' ? 26 : width * 0.045,
  fontWeight: 'bold',
  marginBottom: 15,
  textAlign: 'center',
},


  positionText: {
    color: '#888',
    fontSize: Platform.OS === 'web' ? 14 : width * 0.04,
  },

respostaText: {
  color: '#555',
  fontSize: Platform.OS === 'web' ? 15 : width * 0.037,
  fontStyle: 'italic',
  marginTop: 4,
},

  salaButton: {
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 6,
    minWidth: Platform.OS === 'web' ? 100 : undefined,
    paddingHorizontal: Platform.OS === 'web' ? 18 : width * 0.035,
    paddingVertical: Platform.OS === 'web' ? 8 : height * 0.012,
  },

  salaButtonSelected: {
    backgroundColor: '#6A5ACD',
  },

  salaButtonText: {
    color: '#555',
    fontSize: Platform.OS === 'web' ? 16 : width * 0.035,
    fontWeight: '600',
  },

  salaButtonTextSelected: {
    color: '#fff',
  },

salaOptionButton: {
  alignItems: 'center',
  backgroundColor: '#f5f5f5',
  borderRadius: 8,
  flexDirection: 'row',
  marginBottom: 10,
  paddingHorizontal: Platform.OS === 'web' ? 12 : 16,
  paddingVertical: Platform.OS === 'web' ? 10 : 12,
},

salaOptionText: {
  color: '#333',
  fontSize: Platform.OS === 'web' ? 18 : width * 0.04,
  fontWeight: '500',
},


  salaSelectorContainer: {
    backgroundColor: '#fff',
    borderRadius: 100,
    elevation: 3,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: Platform.OS === 'web' ? 10 : 4,
    paddingVertical: Platform.OS === 'web' ? 6 : 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    width: '100%',
  },

  selectorWrapper: {
    marginBottom: height * 0.02,
  },

  topBar: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: Platform.OS === 'web' ? 20 : 10,
    maxWidth: 700,
    paddingHorizontal: 16,
    width: '100%',
  },

  topBarTitle: {
    color: '#333',
    flex: 1,
    fontSize: Platform.OS === 'web' ? 26 : width * 0.055,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  wrapper: {
    alignSelf: 'center',
    maxWidth: 700,
    width: '100%',
  },
});


export default WaitingQueue;
