import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
  LayoutAnimation,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { width, height } from '../constants/Layout';
import ScreenWrapper from '../components/ScreenWrapper';
import { temPermissaoOrientador } from '../constants/Perfis';

const salas = ['Maca', 'Passe', 'Fraterno'];
const COR_PRIORIDADE_PADRAO = '#4CAF50';

const corPrioridadeCard = (cor) => {
  if (!cor || cor === '#FFF' || cor === '#FFFFFF') return COR_PRIORIDADE_PADRAO;
  return cor;
};

const CustomSalaSelector = ({ selectedIndex, onChange, patients = [] }) => {
  const labels = ['Todos', ...salas];
  const icons = ['users', 'bed', 'hand-paper-o', 'handshake-o'];

  const getCounts = (index) => {
    if (index === 0) return patients.length;
    return patients.filter((p) => p.room === salas[index - 1]).length;
  };

  const handlePress = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange(index);
  };

  return (
    <View style={styles.selectorWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollSelectorContent}
      >
        <View style={styles.salaSelectorContainer}>
          {labels.map((label, index) => {
            const count = getCounts(index);
            return (
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
                {count > 0 && (
                  <View style={[
                    styles.tabBadge,
                    selectedIndex === index && styles.tabBadgeActive,
                  ]}>
                    <Text style={[
                      styles.tabBadgeText,
                      selectedIndex === index && styles.tabBadgeTextActive,
                    ]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
  const [voluntarios, setVoluntarios] = useState(['João', 'Maria', 'José']);
  const [animatingCardId, setAnimatingCardId] = useState(null);
  const animatingCardIdRef = useRef(null);
  const animation = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => global.setTimeout(resolve, 800));
    setRefreshing(false);
  };

  const buscarHistorico = async (idPaciente) => {
    try {
      const colRef = collection(db, 'bzmAtendimentoHist');
      const q = query(colRef, where('id_paciente', '==', idPaciente));
      const snapshot = await getDocs(q);

      const docsOrdenados = [...snapshot.docs].sort((a, b) => {
        const tA = a.data().data_hora?.seconds || 0;
        const tB = b.data().data_hora?.seconds || 0;
        return tB - tA;
      });

      const historico = docsOrdenados.map((docSnap, index) => {
        const dados = docSnap.data();
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

      setHistoricoPaciente(historico);
      setHistoricoModalVisible(true);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      Alert.alert('Erro', 'Não foi possível carregar o histórico.');
    }
  };

  useEffect(() => {
    const colRef = collection(db, 'bzmAtendimentoHist');
    const q = query(colRef, where('status', '==', 'aguardando'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const atendimentos = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          id_paciente: docSnap.data().id_paciente,
          room: docSnap.data().sala_atendida || '',
          priorityColor: corPrioridadeCard(docSnap.data().prioridade),
          orientacao_recebida: docSnap.data().orientacao_recebida || '',
          orientador: docSnap.data().orientador || '',
          data_hora: docSnap.data().data_hora,
        }));

        const atendimentosComDados = await Promise.all(
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
              }
              return {
                ...at,
                name: 'Paciente não encontrado',
                birthDate: '--/--/----',
              };
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

        setPatients((prevPatients) => {
          if (prevPatients.length === 0) {
            return atendimentosComDados.sort((a, b) => {
              const t1 = a.data_hora?.seconds || 0;
              const t2 = b.data_hora?.seconds || 0;
              return t1 - t2;
            });
          }

          const novosPacientesMap = new Map(atendimentosComDados.map(p => [p.id, p]));

          const listaAtualizada = prevPatients
            .filter(p => novosPacientesMap.has(p.id) || p.id === animatingCardIdRef.current)
            .map(p => {
              const novosDados = novosPacientesMap.get(p.id);
              return novosDados ? { ...p, ...novosDados } : p;
            });

          const idsLocais = new Set(prevPatients.map(p => p.id));
          const novosAdicionados = atendimentosComDados.filter(p => !idsLocais.has(p.id));

          return [...listaAtualizada, ...novosAdicionados];
        });
      } catch (error) {
        console.error('Erro ao escutar fila de espera em tempo real:', error);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const buscarVoluntarios = async () => {
      try {
        const q = query(collection(db, 'bzmusuario'));
        const snapshot = await getDocs(q);

        let lista = snapshot.docs
          .filter((docSnap) => temPermissaoOrientador(docSnap.data().permissoes))
          .map((docSnap) => docSnap.data().nome)
          .filter((nome) => !!nome);

        if (lista.length === 0) {
          lista = snapshot.docs
            .map((docSnap) => docSnap.data().nome)
            .filter((nome) => !!nome);
        }

        const listaOrdenada = [...new Set(lista)].sort();
        if (listaOrdenada.length > 0) {
          setVoluntarios(listaOrdenada);
        }
      } catch (error) {
        console.error('Erro ao carregar voluntários/orientadores do Firestore:', error);
      }
    };
    buscarVoluntarios();
  }, []);

  const handleRoomChange = async (room) => {
    if (!selectedPatient) return;
    try {
      const docRef = doc(db, 'bzmAtendimentoHist', selectedPatient.id);
      await updateDoc(docRef, { sala_atendida: room });
      setSelectedPatient((prev) => prev ? { ...prev, room } : null);
    } catch (error) {
      console.error('Erro ao atualizar sala no banco:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a sala.');
    }
    setRoomModalVisible(false);
  };

  const handleTabChange = (index) => setSelectedIndex(index);

  const handleColorChange = async (color) => {
    if (!selectedPatient) return;
    try {
      const docRef = doc(db, 'bzmAtendimentoHist', selectedPatient.id);
      await updateDoc(docRef, { prioridade: color });
      setSelectedPatient((prev) => prev ? { ...prev, priorityColor: color } : null);
    } catch (error) {
      console.error('Erro ao atualizar prioridade no banco:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a prioridade.');
    }
    setColorModalVisible(false);
  };

  const filteredPatients =
    selectedIndex === 0
      ? patients
      : patients.filter((p) => p.room === salas[selectedIndex - 1]);

  const renderItem = ({ item, drag, isActive }) => {
    const position = filteredPatients.filter((p) => p.room === item.room).findIndex((p) => p.id === item.id) + 1;
    const isAnimating = animatingCardId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            borderLeftColor: corPrioridadeCard(item.priorityColor),
            opacity: isActive ? 0.5 : 1,
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
    <ScreenWrapper title="Fila de Espera" scrollable={false}>
      <CustomSalaSelector selectedIndex={selectedIndex} onChange={handleTabChange} patients={patients} />
      <DraggableFlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => {
          setPatients((prevPatients) => {
            if (selectedIndex === 0) return data;
            const salaSelecionada = salas[selectedIndex - 1];
            const foraDaSala = prevPatients.filter((p) => p.room !== salaSelecionada);
            return [...foraDaSala, ...data];
          });
        }}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      {/* Modal: Selecionar Sala */}
      <Modal visible={roomModalVisible} transparent animationType="slide" onRequestClose={() => setRoomModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.botaoFecharModal} onPress={() => setRoomModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Selecione uma Sala</Text>
            <View style={{ width: '100%' }}>
              {salas.map((sala, index) => {
                const salaIcons = ['bed', 'hand-paper-o', 'handshake-o'];
                return (
                  <TouchableOpacity key={sala} style={styles.salaOptionButton} onPress={() => handleRoomChange(sala)}>
                    <Icon name={salaIcons[index]} size={18} color="#555" style={{ marginRight: 12 }} />
                    <Text style={styles.salaOptionText}>{sala}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Prioridade */}
      <Modal visible={colorModalVisible} transparent animationType="slide" onRequestClose={() => setColorModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.botaoFecharModal} onPress={() => setColorModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Escolher prioridade</Text>
            <View style={styles.colorOptions}>
              {['#4CAF50', '#FFD700', '#FF6347', '#90EE90', '#87CEFA'].map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorCircle, { backgroundColor: color }]}
                  onPress={() => handleColorChange(color)}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Histórico */}
      <Modal visible={historicoModalVisible} transparent animationType="fade" onRequestClose={() => setHistoricoModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { alignItems: 'flex-start' }]}>
            <TouchableOpacity style={styles.botaoFecharModal} onPress={() => setHistoricoModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
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
          </View>
        </View>
      </Modal>

      {/* Modal: Orientação */}
      <Modal visible={orientacaoModalVisible} transparent animationType="fade" onRequestClose={() => setOrientacaoModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.botaoFecharModal} onPress={() => setOrientacaoModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Orientação Recebida</Text>

            <TextInput
              placeholder="Escreva a orientação..."
              value={orientacaoTexto}
              onChangeText={setOrientacaoTexto}
              multiline
              style={[styles.input, { height: 100, textAlignVertical: 'top', width: '100%' }]}
            />

            <Text style={{ marginTop: 12, marginBottom: 6 }}>Orientador:</Text>

            <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowDropdown(true)}>
              <Text style={styles.dropdownButtonText}>
                {orientadorSelecionado ? `👤 ${orientadorSelecionado}` : 'Selecionar Orientador'}
              </Text>
            </TouchableOpacity>

            <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
              <View style={styles.dropdownOverlay}>
                <View style={styles.dropdownContainer}>
                  <Text style={styles.modalTitle}>Escolha o orientador</Text>
                  {voluntarios.map((nome) => (
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

            <View style={{ marginTop: 20, width: '100%' }}>
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

                    animatingCardIdRef.current = selectedPatient.id;
                    setAnimatingCardId(selectedPatient.id);
                    setOrientacaoModalVisible(false);
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

                    Animated.timing(animation, {
                      toValue: 1,
                      duration: 1200,
                      useNativeDriver: false,
                    }).start(() => {
                      setPatients((prev) => prev.filter((p) => p.id !== selectedPatient.id));
                      animatingCardIdRef.current = null;
                      setAnimatingCardId(null);
                      animation.setValue(0);
                    });
                  } catch (error) {
                    console.error('Erro ao salvar atendimento:', error);
                    Alert.alert('Erro', 'Não foi possível salvar o atendimento.');
                  }
                }}
                style={[styles.modalCloseButton, { backgroundColor: '#4CAF50', marginTop: 0 }]}
              >
                <Text style={[styles.modalCloseText, { color: '#fff' }]}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
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
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 100,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    minWidth: '100%',
    justifyContent: 'space-around',
  },
  scrollSelectorContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
  tabBadge: {
    marginLeft: 6,
    backgroundColor: 'rgba(106,90,205,0.15)',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6A5ACD',
  },
  tabBadgeTextActive: {
    color: '#fff',
  },
  card: {
    padding: width * 0.04,
    marginBottom: height * 0.018,
    marginHorizontal: width * 0.01,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.07)',
    borderLeftWidth: 4,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
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
    ...(Platform.OS === 'web' && {
      maxWidth: 450,
    }),
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
  dropdownButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxHeight: height * 0.5,
    ...(Platform.OS === 'web' && {
      maxWidth: 450,
    }),
  },
  dropdownOption: {
    paddingVertical: 12,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  botaoFecharModal: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
    padding: 4,
  },
});

export default WaitingQueue;
