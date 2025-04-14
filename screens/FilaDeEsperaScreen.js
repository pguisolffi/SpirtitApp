import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import Icon from 'react-native-vector-icons/FontAwesome';
import SegmentedControlTab from 'react-native-segmented-control-tab';

const salas = ['Maca', 'Passe', 'Fraterno'];

const WaitingQueue = () => {
  const [patients, setPatients] = useState([
    { id: '1', name: 'João Silva', birthDate: '12/03/1990', room: 'Maca', priority: false },
    { id: '2', name: 'Maria Souza', birthDate: '23/07/1985', room: 'Fraterno', priority: true },
    { id: '3', name: 'Carlos Oliveira', birthDate: '15/11/1980', room: 'Passe', priority: false },
    { id: '4', name: 'Ana Costa', birthDate: '05/09/1995', room: 'Fraterno', priority: true },
  ]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  const togglePriority = (id) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, priority: !p.priority } : p
      )
    );
  };

  const handleTabChange = (index) => {
    setSelectedIndex(index);
  };

  // Filtrando pacientes com base no filtro selecionado
  const filteredPatients =
    selectedIndex === 0
      ? patients
      : patients.filter((patient) => patient.room === salas[selectedIndex - 1]);

  const renderItem = ({ item, drag, isActive }) => (
    <TouchableOpacity
      style={[styles.card, item.priority ? styles.priorityCard : null, isActive && { opacity: 0.8 }]}
      onLongPress={drag}
    >
      <Text style={styles.cardText}>Nome: {item.name}</Text>
      <Text style={styles.cardText}>Nascimento: {item.birthDate}</Text>
      <Text style={styles.roomText}>{item.room}</Text>

      <View style={styles.iconContainer}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconButton}>
          <Icon name="pencil" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setSelectedPatient(item);
            setRoomModalVisible(true);
          }}
          style={styles.iconButton}
        >
          <Icon name="exchange" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => togglePriority(item.id)}
          style={styles.priorityIconContainer}
        >
          <Icon
            name="star"
            size={20}
            color={item.priority ? '#FF6347' : '#FFD700'}
            style={[styles.priorityIcon, { opacity: item.priority ? 1 : 0.5 }]}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Controle de Segmentos para "Todos" ou uma Sala específica */}
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
        onDragEnd={({ data }) => setPatients(data)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      {/* Modal de edição */}
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

      {/* Modal de mudança de sala */}
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
              style={styles.editButton}
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
  card: {
    backgroundColor: '#eee',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  priorityCard: {
    backgroundColor: '#ffdddd',
    borderColor: '#ff0000',
    borderWidth: 1.5,
  },
  cardText: { fontSize: 16, marginBottom: 5 },
  roomText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  iconButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 5,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityIconContainer: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityIcon: {
    fontSize: 20,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 15 },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    width: '80%',
    borderRadius: 10,
    alignItems: 'stretch',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  moveButton: {
    backgroundColor: '#FF9800',
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#FF5722',
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
    alignItems: 'center',
  },
});

export default WaitingQueue;
