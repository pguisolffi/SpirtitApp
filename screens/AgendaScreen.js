import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,Dimensions, StyleSheet, Modal
} from "react-native";
import CalendarPicker from "react-native-calendar-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const { width, height } = Dimensions.get("window");

export default function Agenda() {
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [eventos, setEventos] = useState({
    "2025-04-13": [
      {
        titulo: "Meditação Guiada",
        hora: "10:00",
        local: "Sala 1",
        descricao: "Sessão de meditação para iniciantes.",
      },
    ],
  });

  const [novoEvento, setNovoEvento] = useState({
    titulo: "", hora: "", local: "", descricao: ""
  });

  const [formVisivel, setFormVisivel] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [modalAberta, setModalAberta] = useState(false);
  const [editando, setEditando] = useState(false);
  const [participacoes, setParticipacoes] = useState({});

  const usuarioAutorizado = true; // define a regra depois
  const dataChave = format(dataSelecionada, "yyyy-MM-dd");
  const eventosDoDia = eventos[dataChave] || [];

  const salvarNovoEvento = () => {
    const { titulo, hora, local, descricao } = novoEvento;
    if (!titulo || !hora || !local) return;

    setEventos((prev) => ({
      ...prev,
      [dataChave]: [...eventosDoDia, novoEvento],
    }));

    setNovoEvento({ titulo: "", hora: "", local: "", descricao: "" });
    setFormVisivel(false);
  };

  const abrirDetalhesEvento = (evento, index) => {
    setEventoSelecionado({ ...evento, index });
    setModalAberta(true);
    setEditando(false);
  };

  const salvarEdicao = () => {
    const novosEventos = [...eventosDoDia];
    novosEventos[eventoSelecionado.index] = {
      titulo: eventoSelecionado.titulo,
      hora: eventoSelecionado.hora,
      local: eventoSelecionado.local,
      descricao: eventoSelecionado.descricao,
    };

    setEventos((prev) => ({
      ...prev,
      [dataChave]: novosEventos,
    }));

    setEditando(false);
    setModalAberta(false);
  };

  const toggleParticipacao = () => {
    const key = `${dataChave}_${eventoSelecionado.index}`;
    setParticipacoes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const estaParticipando = eventoSelecionado
    ? participacoes[`${dataChave}_${eventoSelecionado.index}`]
    : false;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Agenda de Eventos</Text>

      <View style={styles.header}>
        <Text style={styles.subtitulo}>
          Eventos em {format(dataSelecionada, "dd 'de' MMMM", { locale: ptBR })}
        </Text>
        <TouchableOpacity style={styles.botaoNovo} onPress={() => setFormVisivel(!formVisivel)}>
          <Text style={styles.botaoTexto}>+ Novo Evento</Text>
        </TouchableOpacity>
      </View>

      {formVisivel && (
        <View style={styles.formulario}>
          <TextInput
            style={styles.input}
            placeholder="Título"
            value={novoEvento.titulo}
            onChangeText={(text) => setNovoEvento({ ...novoEvento, titulo: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Hora (ex: 14:00)"
            value={novoEvento.hora}
            onChangeText={(text) => setNovoEvento({ ...novoEvento, hora: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Local"
            value={novoEvento.local}
            onChangeText={(text) => setNovoEvento({ ...novoEvento, local: text })}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Descrição"
            multiline
            numberOfLines={3}
            value={novoEvento.descricao}
            onChangeText={(text) => setNovoEvento({ ...novoEvento, descricao: text })}
          />
          <TouchableOpacity style={styles.botaoSalvar} onPress={salvarNovoEvento}>
            <Text style={styles.botaoTexto}>Salvar Evento</Text>
          </TouchableOpacity>
        </View>
      )}

      <CalendarPicker
        onDateChange={(date) => setDataSelecionada(new Date(date))}
        selectedStartDate={dataSelecionada}
        locale="pt"
        weekdays={["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]}
        months={[
          "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ]}
        todayBackgroundColor="#f2f2f2"
        selectedDayColor="#4f46e5"
        selectedDayTextColor="#fff"
      />

      <View style={styles.eventos}>
        {eventosDoDia.length === 0 ? (
          <Text style={styles.semEvento}>Nenhum evento para este dia.</Text>
        ) : (
          eventosDoDia.map((evento, index) => (
            <TouchableOpacity
              key={index}
              style={styles.cartaoEvento}
              onPress={() => abrirDetalhesEvento(evento, index)}
            >
              <Text style={styles.eventoTitulo}>{evento.titulo}</Text>
              <Text style={styles.eventoInfo}>{evento.hora} - {evento.local}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <Modal visible={modalAberta} animationType="slide" transparent={true}>
        <View style={styles.modalFundo}>
          <View style={styles.modalConteudo}>
            {eventoSelecionado && (
              <>
                {editando ? (
                  <>
                    <TextInput
                      style={styles.input}
                      value={eventoSelecionado.titulo}
                      onChangeText={(text) =>
                        setEventoSelecionado({ ...eventoSelecionado, titulo: text })
                      }
                    />
                    <TextInput
                      style={styles.input}
                      value={eventoSelecionado.hora}
                      onChangeText={(text) =>
                        setEventoSelecionado({ ...eventoSelecionado, hora: text })
                      }
                    />
                    <TextInput
                      style={styles.input}
                      value={eventoSelecionado.local}
                      onChangeText={(text) =>
                        setEventoSelecionado({ ...eventoSelecionado, local: text })
                      }
                    />
                    <TextInput
                      style={[styles.input, styles.textarea]}
                      value={eventoSelecionado.descricao}
                      multiline
                      onChangeText={(text) =>
                        setEventoSelecionado({ ...eventoSelecionado, descricao: text })
                      }
                    />
                    <TouchableOpacity style={styles.botaoSalvar} onPress={salvarEdicao}>
                      <Text style={styles.botaoTexto}>Salvar Alterações</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.eventoTitulo}>{eventoSelecionado.titulo}</Text>
                    <Text style={styles.eventoInfo}>
                      {eventoSelecionado.hora} - {eventoSelecionado.local}
                    </Text>
                    <Text style={styles.eventoDescricao}>{eventoSelecionado.descricao}</Text>

                    {usuarioAutorizado && (
                      <>
                        <TouchableOpacity
                          style={styles.botaoEditar}
                          onPress={() => setEditando(true)}
                        >
                          <Text style={styles.botaoTexto}>Editar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                        style={[
                            styles.botaoSalvar,
                            {
                            marginTop: 10,
                            backgroundColor: estaParticipando ? "#dc2626" : "#16a34a", // vermelho ou verde
                            },
                        ]}
                        onPress={toggleParticipacao}
                        >
                        <Text style={styles.botaoTexto}>
                            {estaParticipando
                            ? "Remover participação"
                            : "Participar como voluntário"}
                        </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </>
                )}
                <TouchableOpacity
                  style={[styles.botaoCancelar, { marginTop: 10 }]}
                  onPress={() => setModalAberta(false)}
                >
                  <Text style={[styles.botaoTexto, { color: "#111" }]}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: height * 0.1, padding: 16, backgroundColor: "#fff" },
  titulo: { fontSize: 26, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  subtitulo: { fontSize: 18, fontWeight: "600" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  botaoNovo: { backgroundColor: "#4f46e5", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  botaoSalvar: { backgroundColor: "#16a34a", padding: 10, borderRadius: 6, marginTop: 8 },
  botaoEditar: { backgroundColor: "#eab308", padding: 10, borderRadius: 6, marginTop: 10 },
  botaoCancelar: { backgroundColor: "#e5e7eb", padding: 10, borderRadius: 6 },
  botaoTexto: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  formulario: { backgroundColor: "#f3f4f6", padding: 16, borderRadius: 8, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 6, marginBottom: 8 },
  textarea: { height: 80, textAlignVertical: "top" },
  eventos: { marginTop: 16 },
  cartaoEvento: { borderWidth: 1, borderColor: "#e5e7eb", padding: 12, borderRadius: 6, marginBottom: 8, backgroundColor: "#fff", elevation: 2 },
  eventoTitulo: { fontSize: 16, fontWeight: "bold" },
  eventoInfo: { fontSize: 14, color: "#4b5563" },
  eventoDescricao: { marginTop: 4, fontSize: 14, color: "#374151" },
  semEvento: { color: "#6b7280", fontStyle: "italic", marginTop: 8 },
  modalFundo: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  modalConteudo: { backgroundColor: "#fff", padding: 20, borderRadius: 10, width: "90%" },
});
