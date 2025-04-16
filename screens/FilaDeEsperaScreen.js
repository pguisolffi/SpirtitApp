import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import DraggableFlatList from 'react-native-draggable-flatlist';

const salas = ['Maca', 'Passe', 'Fraterno'];

const WaitingQueue = () => {
  const [patients, setPatients] = useState([
    { id: '1', name: 'João Silva', birthDate: '12/03/1990', room: 'Maca', priorityColor: '#FFD700' },
    { id: '2', name: 'Maria Souza', birthDate: '23/07/1985', room: 'Fraterno', priorityColor: '#FFD700' },
    { id: '3', name: 'Carlos Oliveira', birthDate: '15/11/1980', room: 'Passe', priorityColor: '#FFF' },
    { id: '4', name: 'Ana Costa', birthDate: '05/09/1995', room: 'Fraterno', priorityColor: '#FFF' },
  ]);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);  // Novo estado para controlar o modal de cor
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedCard, setExpandedCard] = useState(null);

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
      prev.map((p) =>
        p.id === selectedPatient.id ? updatedPatient : p
      )
    );
    setSelectedPatient(updatedPatient);
    setRoomModalVisible(false);
  };

  const handleTabChange = (index) => {
    setSelectedIndex(index);
  };

  const handleShowHistory = (patientId) => {
    alert(`Histórico de atendimentos para o paciente ${patientId}`);
  };

  const handleColorChange = (color) => {
    if (!selectedPatient) return;
    const updatedPatient = { ...selectedPatient, priorityColor: color };
    setPatients((prev) =>
      prev.map((p) =>
        p.id === selectedPatient.id ? updatedPatient : p
      )
    );
    setSelectedPatient(updatedPatient);
    setColorModalVisible(false);  // Fecha o modal após a escolha da cor
  };

  const filteredPatients =
    selectedIndex === 0
      ? patients
      : patients.filter((patient) => patient.room === salas[selectedIndex - 1]);

  const renderItem = ({ item, drag, isActive }) => {
    const position = filteredPatients.filter(p => p.room === item.room)
                                     .findIndex(p => p.id === item.id) + 1;

    return (
      <TouchableOpacity
        style={[styles.card, { borderColor: item.priorityColor, borderLeftWidth: 6, opacity: isActive ? 0.5 : 1 }]}
        onLongPress={drag}
        onPress={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.positionText}>#{position}</Text>
        </View>
        <Text style={styles.cardSubText}>Nascimento: {item.birthDate}</Text>
        <Text style={[styles.cardSubText, { fontWeight: 'bold' }]}>{item.room}</Text>

        {expandedCard === item.id && (
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
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
              onPress={() => handleShowHistory(item.id)}
              style={styles.actionButton}
            >
              <Icon name="eye" size={18} color="#fff" />
            </TouchableOpacity>
            {/* Botão para abrir o modal de cor */}
            <TouchableOpacity
              onPress={() => {
                setSelectedPatient(item);
                setColorModalVisible(true);  // Abre o modal de cor
              }}
              style={[styles.actionButton, { backgroundColor: item.priorityColor || '#FFF' }]}
            >
              <Icon name="paint-brush" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleDragEnd = (data) => {
    setPatients(data);
  };

  return (
    <View style={styles.container}>
      <SegmentedControlTab
        values={['Todos', ...salas]}
        selectedIndex={selectedIndex}
        onTabPress={handleTabChange}
        tabsContainerStyle={styles.segmentedControl}
        activeTabStyle={styles.activeTab}
        tabStyle={styles.inactiveTab}
        borderRadius={5}
      />

      <DraggableFlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => handleDragEnd(data)}
      />

      {/* Modal de edição de paciente */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              value={selectedPatient?.name}
              onChangeText={(text) =>
                setSelectedPatient({ ...selectedPatient, name: text })
              }
              placeholder="Nome"
              style={styles.input}
            />
            <TextInput
              value={selectedPatient?.birthDate}
              onChangeText={(text) =>
                setSelectedPatient({ ...selectedPatient, birthDate: text })
              }
              placeholder="Nascimento"
              style={styles.input}
            />
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para mudança de sala */}
      <Modal visible={roomModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {salas.map((sala) => (
              <TouchableOpacity
                key={sala}
                onPress={() => handleRoomChange(sala)}
                style={styles.moveButton}
              >
                <Text style={styles.buttonText}>{sala}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setRoomModalVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para seleção de cor */}
      <Modal visible={colorModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.label}>Escolha a cor para a borda:</Text>
            {/* Lista de cores para selecionar */}
            {['#FF6347', '#FFD700', '#32CD32', '#1E90FF', '#8A2BE2'].map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => handleColorChange(color)}
                style={[styles.colorOption, { backgroundColor: color }]}
              />
            ))}
            <TouchableOpacity
              onPress={() => setColorModalVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  segmentedControl: { marginBottom: 20 },
  activeTab: { backgroundColor: '#4CAF50' },
  inactiveTab: { backgroundColor: '#F0F0F0' },
  card: { padding: 15, marginBottom: 10, borderRadius: 8, backgroundColor: '#fff' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardName: { fontSize: 16, fontWeight: 'bold' },
  positionText: { fontSize: 14, color: '#888' },
  cardSubText: { fontSize: 14, color: '#555' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  actionButton: { padding: 5, borderRadius: 50, backgroundColor: '#4CAF50' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { padding: 20, backgroundColor: '#fff', borderRadius: 8, width: 300 },
  cancelButton: { marginTop: 15, backgroundColor: '#f44336', padding: 10, borderRadius: 5 },
  moveButton: { backgroundColor: '#2196F3', padding: 10, borderRadius: 5, marginBottom: 10 },
  saveButton: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 5 },
  buttonText: { color: '#fff', textAlign: 'center' },
  input: { height: 40, borderColor: '#ddd', borderWidth: 1, marginBottom: 10, paddingLeft: 10 },
  label: { marginVertical: 5, fontSize: 16 },
  colorOption: { width: 50, height: 50, margin: 5, borderRadius: 5 },
});

export default WaitingQueue;
