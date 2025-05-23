import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Dimensions,
  Platform,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { db } from "./firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

const { width, height } = Dimensions.get("window");

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TelaVoluntariosEventos() {
  const [viewMode, setViewMode] = useState("voluntarios");
  const [voluntariosSelecionados, setVoluntariosSelecionados] = useState({});
  const [eventosSelecionados, setEventosSelecionados] = useState({});
  const [voluntarios, setVoluntarios] = useState([]);
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const participacoesSnap = await getDocs(collection(db, "bzmParticipacaoAgenda"));
        const agendaSnap = await getDocs(collection(db, "bzmagenda"));
        const usuariosSnap = await getDocs(collection(db, "bzmusuario"));

        const participacoes = participacoesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const agendas = agendaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const usuarios = usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const voluntariosComEventos = usuarios.map((usuario) => {
          const eventosDoUsuario = participacoes
            .filter(p => p.idUsuario === usuario.uid)
            .map(p => {
              const evento = agendas.find(a => a.id === p.idAgenda);
              return evento ? {
                eventoId: evento.id,
                nomeEvento: evento.titulo,
                data: evento.data
              } : null;
            })
            .filter(Boolean);

          return eventosDoUsuario.length > 0
            ? { id: usuario.uid, nome: usuario.nome, eventos: eventosDoUsuario }
            : null;
        }).filter(Boolean);

        const eventosComVoluntarios = agendas.map((evento) => {
          const participantes = participacoes
            .filter(p => p.idAgenda === evento.id)
            .map(p => {
              const voluntario = usuarios.find(u => u.uid === p.idUsuario);
              return voluntario ? { id: voluntario.uid, nome: voluntario.nome } : null;
            })
            .filter(Boolean);

          return { eventoId: evento.id, nome: evento.titulo, data: evento.data, voluntarios: participantes };
        });

        setVoluntarios(voluntariosComEventos);
        setEventos(eventosComVoluntarios);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    carregarDados();
  }, []);

  const handleSelectChange = (value) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewMode(value);
  };

  const toggleVoluntario = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setVoluntariosSelecionados(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleEvento = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEventosSelecionados(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderVoluntarios = () => (
    <FlatList
      data={voluntarios}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ paddingBottom: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => toggleVoluntario(item.id)}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.nome}</Text>
            <AntDesign
              name={voluntariosSelecionados[item.id] ? "up" : "down"}
              size={20}
              color="#6A5ACD"
            />
          </View>

          {voluntariosSelecionados[item.id] && item.eventos?.map((evento) => (
            <View key={evento.eventoId} style={styles.cardDetails}>
              <Text style={styles.detailText}>📍 {evento.nomeEvento}</Text>
              <Text style={styles.detailDate}>🗓 {evento.data}</Text>
            </View>
          ))}
        </TouchableOpacity>
      )}
    />
  );

  const renderEventos = () => (
    <FlatList
      data={eventos}
      keyExtractor={(item) => item.eventoId.toString()}
      contentContainerStyle={{ paddingBottom: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => toggleEvento(item.eventoId)}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.nome} ({item.data})</Text>
            <AntDesign
              name={eventosSelecionados[item.eventoId] ? "up" : "down"}
              size={20}
              color="#6A5ACD"
            />
          </View>

          {eventosSelecionados[item.eventoId] && item.voluntarios?.map((vol) => (
            <View key={vol.id} style={styles.cardDetails}>
              <Text style={styles.detailText}>🙋 {vol.nome}</Text>
            </View>
          ))}
        </TouchableOpacity>
      )}
    />
  );

  return (
    <View style={styles.screenContainer}> 
      <View style={styles.contentContainer}> 
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={[styles.titulo, { flex: 1, textAlign: 'center' }]}>Escala de Voluntários</Text>
        </View>

        <CustomToggle selected={viewMode} onChange={handleSelectChange} />

        {viewMode === "voluntarios" ? renderVoluntarios() : renderEventos()}

        <TouchableOpacity style={styles.fab} onPress={() => console.log('Adicionar Novo')}>
          <AntDesign name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CustomToggle = ({ selected, onChange }) => (
  <View style={styles.toggleContainer}>
    <TouchableOpacity
      style={[styles.toggleButton, selected === "voluntarios" && styles.toggleSelected]}
      onPress={() => onChange("voluntarios")}
    >
      <Text style={[styles.toggleText, selected === "voluntarios" && styles.toggleTextSelected]}>
        👤 Voluntários
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.toggleButton, selected === "eventos" && styles.toggleSelected]}
      onPress={() => onChange("eventos")}
    >
      <Text style={[styles.toggleText, selected === "eventos" && styles.toggleTextSelected]}>
        📅 Eventos
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 20,
  },
  contentContainer: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 1000 : '100%',
    paddingHorizontal: Platform.OS === 'web' ? 40 : 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  titulo: {
    fontSize: Platform.OS === 'web' ? 28 : 22,
    fontWeight: "bold",
    color: "#333",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#eee",
    borderRadius: 25,
    padding: Platform.OS === 'web' ? 8 : 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 14 : 10,
    borderRadius: 20,
    alignItems: "center",
  },
  toggleSelected: {
    backgroundColor: "#6A5ACD",
  },
  toggleText: {
    color: "#555",
    fontWeight: "600",
    fontSize: Platform.OS === 'web' ? 18 : 14,
  },
  toggleTextSelected: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: Platform.OS === 'web' ? 20 : 16,
    fontWeight: "bold",
    color: "#333",
  },
  cardDetails: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
  },
  detailText: {
    fontSize: Platform.OS === 'web' ? 18 : 14,
    marginBottom: 4,
    color: "#444",
  },
  detailDate: {
    fontSize: Platform.OS === 'web' ? 16 : 13,
    color: "#777",
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6A5ACD',
    borderRadius: 30,
    padding: 15,
    elevation: 5,
  },
});
