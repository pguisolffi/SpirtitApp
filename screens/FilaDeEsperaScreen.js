import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import DraggableFlatList from 'react-native-draggable-flatlist';

const { width, height } = Dimensions.get('window');
const salas = ['Maca', 'Passe', 'Fraterno'];

const CustomSalaSelector = ({ selectedIndex, onChange }) => {
  const labels = ['Todos', 'Maca', 'Passe', 'Fraterno'];
  const icons = ['👥', '🛏', '👐', '🤝'];

  return (
    <View style={styles.salaSelectorContainer}>
      {labels.map((label, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.salaButton,
            selectedIndex === index && styles.salaButtonSelected,
          ]}
          onPress={() => onChange(index)}
        >
          <Text
            style={[
              styles.salaButtonText,
              selectedIndex === index && styles.salaButtonTextSelected,
            ]}
            numberOfLines={1}
          >
            {icons[index]} {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

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
  const [colorModalVisible, setColorModalVisible] = useState(false);
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
      prev.map((p) => (p.id === selectedPatient.id ? updatedPatient : p))
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
      prev.map((p) => (p.id === selectedPatient.id ? updatedPatient : p))
    );
    setSelectedPatient(updatedPatient);
    setColorModalVisible(false);
  };

  const filteredPatients =
    selectedIndex === 0
      ? patients
      : patients.filter((patient) => patient.room === salas[selectedIndex - 1]);

  const renderItem = ({ item, drag, isActive }) => {
    const position =
      filteredPatients.filter((p) => p.room === item.room).findIndex((p) => p.id === item.id) + 1;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            borderColor: item.priorityColor,
            borderLeftWidth: 6,
            opacity: isActive ? 0.5 : 1,
          },
        ]}
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
            <TouchableOpacity
              onPress={() => {
                setSelectedPatient(item);
                setColorModalVisible(true);
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
      <CustomSalaSelector selectedIndex={selectedIndex} onChange={handleTabChange} />

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
  container: {
    paddingTop: height * 0.1,
    flex: 1,
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.02,
  },
  salaSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.02,
    backgroundColor: '#eee',
    borderRadius: width * 0.05,
    padding: 1,
  },
  salaButton: {
    width: width * 0.22,
    alignItems: 'center',
    paddingVertical: height * 0.015,
    marginHorizontal: 4,
    backgroundColor: '#ddd',
    borderRadius: width * 0.05,
  },
  salaButtonSelected: {
    backgroundColor: '#6A5ACD',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  salaButtonText: {
    fontSize: width * 0.032,
    color: '#444',
    fontWeight: '600',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: width * 0.05,
    backgroundColor: '#fff',
    borderRadius: width * 0.03,
    width: width * 0.8,
  },
  cancelButton: {
    marginTop: height * 0.02,
    backgroundColor: '#f44336',
    padding: height * 0.015,
    borderRadius: width * 0.02,
  },
  moveButton: {
    backgroundColor: '#2196F3',
    padding: height * 0.015,
    borderRadius: width * 0.02,
    marginBottom: height * 0.01,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: height * 0.015,
    borderRadius: width * 0.02,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: width * 0.04,
  },
  input: {
    height: height * 0.06,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: height * 0.015,
    paddingLeft: width * 0.03,
    fontSize: width * 0.04,
  },
  label: {
    marginVertical: height * 0.01,
    fontSize: width * 0.04,
  },
  colorOption: {
    width: width * 0.1,
    height: width * 0.1,
    margin: width * 0.015,
    borderRadius: width * 0.015,
  },
});

export default WaitingQueue;
