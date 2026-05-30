import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  LayoutAnimation,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { width, height } from "../constants/Layout";

const dadosVoluntarios = [
  {
    id: 1,
    nome: "João da Silva",
    eventos: [
      { eventoId: 101, nomeEvento: "Distribuição de Cestas Básicas", data: "2025-04-13" },
      { eventoId: 102, nomeEvento: "Bazar Solidário", data: "2025-04-14" },
    ],
  },
  {
    id: 2,
    nome: "Maria Costa",
    eventos: [
      { eventoId: 101, nomeEvento: "Distribuição de Cestas Básicas", data: "2025-04-13" },
    ],
  },
];

const dadosEventos = [
  {
    eventoId: 101,
    nome: "Distribuição de Cestas Básicas",
    data: "2025-04-13",
    voluntarios: [
      { id: 1, nome: "João da Silva" },
      { id: 2, nome: "Maria Costa" },
    ],
  },
  {
    eventoId: 102,
    nome: "Bazar Solidário",
    data: "2025-04-14",
    voluntarios: [{ id: 1, nome: "João da Silva" }],
  },
];

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

import ScreenWrapper from '../components/ScreenWrapper';

export default function TelaVoluntariosEventos() {
  const [viewMode, setViewMode] = useState("voluntarios");
  const [voluntarioSelecionado, setVoluntarioSelecionado] = useState(null);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);

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
      data={dadosVoluntarios}
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
      data={dadosEventos}
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
    <ScreenWrapper title="Escala de Voluntários" scrollable={false}>
      <CustomToggle selected={viewMode} onChange={handleSelectChange} />
      {viewMode === "voluntarios" ? renderVoluntarios() : renderEventos()}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {paddingTop: height * 0.1, flex: 1, padding: 16, backgroundColor: "#fdfdfd" },

  // Toggle estilizado
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#eee",
    borderRadius: 25,
    padding: 4,
    marginBottom: 16,
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

  // Card padrão
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
