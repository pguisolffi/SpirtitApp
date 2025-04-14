import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import RNPickerSelect from 'react-native-picker-select'; // Usando a biblioteca react-native-picker-select

const dadosVoluntarios = [
  { id: 1, nome: "João da Silva", eventos: [{ eventoId: 101, nomeEvento: "Distribuição de Cestas Básicas", data: "2025-04-13" }, { eventoId: 102, nomeEvento: "Bazar Solidário", data: "2025-04-14" }] },
  { id: 2, nome: "Maria Costa", eventos: [{ eventoId: 101, nomeEvento: "Distribuição de Cestas Básicas", data: "2025-04-13" }] },
];

const dadosEventos = [
  { eventoId: 101, nome: "Distribuição de Cestas Básicas", data: "2025-04-13", voluntarios: [{ id: 1, nome: "João da Silva" }, { id: 2, nome: "Maria Costa" }] },
  { eventoId: 102, nome: "Bazar Solidário", data: "2025-04-14", voluntarios: [{ id: 1, nome: "João da Silva" }] },
];

export default function TelaVoluntariosEventos() {
  const [viewMode, setViewMode] = useState("voluntarios"); // "voluntarios" ou "eventos"
  const [voluntarioSelecionado, setVoluntarioSelecionado] = useState(null);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);

  const handleSelectChange = (value) => {
    setViewMode(value);
    setVoluntarioSelecionado(null); // Resetando seleção anterior
    setEventoSelecionado(null); // Resetando seleção anterior
  };

  const renderVoluntarios = () => (
    <FlatList
      data={dadosVoluntarios}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => setVoluntarioSelecionado(item)}>
          <Text style={styles.itemText}>{item?.nome || "Nome não disponível"}</Text>
          {voluntarioSelecionado?.id === item?.id && item?.eventos && (
            <FlatList
              data={item?.eventos}
              keyExtractor={(evento) => evento.eventoId.toString()}
              renderItem={({ item }) => (
                <Text style={styles.detailsText}>{item?.nomeEvento || "Nome do evento não disponível"} - {item?.data || "Data não disponível"}</Text>
              )}
            />
          )}
        </TouchableOpacity>
      )}
    />
  );

  const renderEventos = () => (
    <FlatList
      data={dadosEventos}
      keyExtractor={(item) => item.eventoId.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => setEventoSelecionado(item)}>
          <Text style={styles.itemText}>{item?.nome || "Nome do evento não disponível"} - {item?.data || "Data não disponível"}</Text>
          {eventoSelecionado?.eventoId === item?.eventoId && item?.voluntarios && (
            <FlatList
              data={item?.voluntarios}
              keyExtractor={(voluntario) => voluntario.id.toString()}
              renderItem={({ item }) => (
                <Text style={styles.detailsText}>{item?.nome || "Nome do voluntário não disponível"}</Text>
              )}
            />
          )}
        </TouchableOpacity>
      )}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <RNPickerSelect
          onValueChange={handleSelectChange}
          value={viewMode}
          items={[
            { label: "Voluntários", value: "voluntarios" },
            { label: "Eventos", value: "eventos" },
          ]}
          style={{
            inputAndroid: styles.selectInput, // Estilo para Android
            inputIOS: styles.selectInput, // Estilo para iOS
            iconContainer: { top: 10, right: 12 }, // Estilo do ícone do ComboBox
          }}
        />
      </View>

      {viewMode === "voluntarios" ? renderVoluntarios() : renderEventos()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { marginBottom: 16, marginTop: 16 },
  itemText: { fontSize: 16, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: "#f0f0f0", marginBottom: 8, borderRadius: 8 },
  detailsText: { fontSize: 14, paddingVertical: 5, paddingHorizontal: 16, backgroundColor: "#f9f9f9", marginBottom: 6, borderRadius: 8 },
  selectInput: {
    fontSize: 18,
    paddingVertical: 8,  // Diminuindo o espaço superior e inferior
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 20, // Bordas mais arredondadas
    borderColor: "#6A5ACD", // Cor suave para a borda
    backgroundColor: "#f0f0f0", // Cor de fundo suave
    color: "#333", // Cor do texto
    marginHorizontal: 10,
    shadowColor: "#000", // Sombra para o efeito 3D
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8, // Elevação para efeito 3D no Android
  },
});
