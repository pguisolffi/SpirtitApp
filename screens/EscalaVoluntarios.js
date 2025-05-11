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
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

const { width, height } = Dimensions.get("window");

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TelaVoluntariosEventos() {
  const [viewMode, setViewMode] = useState("voluntarios");
  const [voluntarioSelecionado, setVoluntarioSelecionado] = useState(null);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [dadosVoluntarios, setDadosVoluntarios] = useState([]);
  const [dadosEventos, setDadosEventos] = useState([]);
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
  
        // Montar lista de voluntários com eventos
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
            ? {
                id: usuario.uid,
                nome: usuario.nome,
                eventos: eventosDoUsuario
              }
            : null;
        }).filter(Boolean); // Remove nulos
  
        // Montar lista de eventos com voluntários
        const eventosComVoluntarios = agendas.map((evento) => {
          const participantes = participacoes
            .filter(p => p.idAgenda === evento.id)
            .map(p => {
              const voluntario = usuarios.find(u => u.uid === p.idUsuario);
              return voluntario ? { id: voluntario.uid, nome: voluntario.nome } : null;
            })
            .filter(Boolean);
  
          return {
            eventoId: evento.id,
            nome: evento.titulo,
            data: evento.data,
            voluntarios: participantes
          };
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
    setVoluntarioSelecionado(null);
    setEventoSelecionado(null);
  };

  const toggleVoluntario = (item) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setVoluntarioSelecionado((prev) => (prev?.id === item.id ? null : item));
  };

  const toggleEvento = (item) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEventoSelecionado((prev) => (prev?.eventoId === item.eventoId ? null : item));
  };

  const renderVoluntarios = () => (
    <FlatList
      data={voluntarios}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => toggleVoluntario(item)}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.nome}</Text>
            <AntDesign
              name={voluntarioSelecionado?.id === item.id ? "up" : "down"}
              size={20}
              color="#6A5ACD"
            />
          </View>
  
          {voluntarioSelecionado?.id === item.id &&
            item.eventos?.map((evento) => (
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
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => toggleEvento(item)}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {item.nome} ({item.data})
            </Text>
            <AntDesign
              name={eventoSelecionado?.eventoId === item.eventoId ? "up" : "down"}
              size={20}
              color="#6A5ACD"
            />
          </View>
  
          {eventoSelecionado?.eventoId === item.eventoId &&
            item.voluntarios?.map((vol) => (
              <View key={vol.id} style={styles.cardDetails}>
                <Text style={styles.detailText}>🙋 {vol.nome}</Text>
              </View>
            ))}
        </TouchableOpacity>
      )}
    />
  );
  

  return (
<View style={styles.container}>
  <Text style={styles.titulo}>Escala de Voluntários</Text>
  <CustomToggle selected={viewMode} onChange={handleSelectChange} />
  {viewMode === "voluntarios" ? renderVoluntarios() : renderEventos()}
</View>
  );
}

const CustomToggle = ({ selected, onChange }) => {
  return (
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
};

const styles = StyleSheet.create({
  container: { paddingTop: height * 0.1, flex: 1, padding: 16, backgroundColor: "#fdfdfd" },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#eee",
    borderRadius: 25,
    padding: 4,
    marginBottom: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    color: "#333",
    paddingBottom: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  toggleSelected: {
    backgroundColor: "#6A5ACD",
  },
  toggleText: {
    color: "#555",
    fontWeight: "600",
  },
  toggleTextSelected: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
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
    fontSize: 14,
    marginBottom: 4,
    color: "#444",
  },
  detailDate: {
    fontSize: 13,
    color: "#777",
  },
});
