import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  Modal,
  Alert,
  Animated,
  Platform,
} from "react-native";
import CalendarPicker from "react-native-calendar-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { auth } from "./firebaseConfig"; // Certifique-se de importar corretamente
import { podeGerenciarModulo } from "../constants/Perfis";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { width, height } from "../constants/Layout";
import { Ionicons } from "@expo/vector-icons";

import ScreenWrapper from '../components/ScreenWrapper';

export default function Agenda() {
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [eventos, setEventos] = useState({});
  const [novoEvento, setNovoEvento] = useState({
    titulo: "",
    hora: "",
    local: "",
    descricao: "",
  });
  const [formVisivel, setFormVisivel] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [modalAberta, setModalAberta] = useState(false);
  const [editando, setEditando] = useState(false);
  const [participacoes, setParticipacoes] = useState({});
  const [usuario, setUsuario] = useState(null);
  const [usuarioAutorizado, setUsuarioAutorizado] = useState(false);
  const [errosNovo, setErrosNovo] = useState({ titulo: false, hora: false, local: false });
  const [errosEdicao, setErrosEdicao] = useState({ titulo: false, hora: false, local: false });
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 5, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -5, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const dataChave = format(dataSelecionada, "yyyy-MM-dd");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUsuario(user);
        console.log("Usuário autenticado:", user.uid);
        buscarPerfilUsuario(); // 👈 chamada única aqui
      } else {
        setUsuario(null);
        setUsuarioAutorizado(false);
      }
    });
  
    return () => unsubscribe();
  }, []);
  


  const buscarPerfilUsuario = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, "bzmusuario"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
  
        if (!querySnapshot.empty) {
          const dados = querySnapshot.docs[0].data();
          setUsuarioAutorizado(
            podeGerenciarModulo(dados.perfil, dados.permissoes, "eventos")
          );
        } else {
          console.warn("Usuário não encontrado na coleção bzmusuario");
          setUsuarioAutorizado(false);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar perfil do usuário:", error);
      setUsuarioAutorizado(false);
    }
  };
  
  

  useEffect(() => {
    const q = query(collection(db, "bzmagenda"), where("data", "==", dataChave));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventosDoDia = [];
      querySnapshot.forEach((doc) => {
        eventosDoDia.push({ id: doc.id, ...doc.data() });
      });
      setEventos((prev) => ({ ...prev, [dataChave]: eventosDoDia }));
    });

    return () => unsubscribe();
  }, [dataChave]);

  const salvarNovoEvento = async () => {
    const { titulo, hora, local, descricao } = novoEvento;
    const novosErros = {
      titulo: !titulo,
      hora: !hora,
      local: !local,
    };
    setErrosNovo(novosErros);

    if (!titulo || !hora || !local) {
      triggerShake();
      return;
    }

    try {
      await addDoc(collection(db, "bzmagenda"), {
        data: dataChave,
        titulo,
        hora,
        local,
        descricao,
        usuarioCriacao: usuario.uid,
      });
      setNovoEvento({ titulo: "", hora: "", local: "", descricao: "" });
      setErrosNovo({ titulo: false, hora: false, local: false });
      setFormVisivel(false);
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
    }
  };

  const abrirDetalhesEvento = async (evento) => {
    setEventoSelecionado(evento);
    setModalAberta(true);
    setEditando(false);
    setErrosEdicao({ titulo: false, hora: false, local: false });

    // Verificar se o usuário já está participando
    const q = query(
      collection(db, "bzmParticipacaoAgenda"),
      where("idAgenda", "==", evento.id),
      where("idUsuario", "==", usuario.uid)
    );
    const querySnapshot = await getDocs(q);
    setParticipacoes((prev) => ({
      ...prev,
      [evento.id]: !querySnapshot.empty,
    }));
  };

  const salvarEdicao = async () => {
    const { id, titulo, hora, local, descricao } = eventoSelecionado;
    const novosErros = {
      titulo: !titulo,
      hora: !hora,
      local: !local,
    };
    setErrosEdicao(novosErros);

    if (!titulo || !hora || !local) {
      triggerShake();
      return;
    }

    try {
      await updateDoc(doc(db, "bzmagenda", id), {
        titulo,
        hora,
        local,
        descricao,
      });
      setEditando(false);
      setModalAberta(false);
      setErrosEdicao({ titulo: false, hora: false, local: false });
    } catch (error) {
      console.error("Erro ao editar evento:", error);
    }
  };

  const excluirEvento = async () => {
    Alert.alert("Confirmação", "Deseja excluir este evento?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "bzmagenda", eventoSelecionado.id));
            setModalAberta(false);
          } catch (error) {
            console.error("Erro ao excluir evento:", error);
          }
        },
      },
    ]);
  };

  const toggleParticipacao = async () => {
    const participando = participacoes[eventoSelecionado.id];
    try {
      if (participando) {
        // Remover participação
        const q = query(
          collection(db, "bzmParticipacaoAgenda"),
          where("idAgenda", "==", eventoSelecionado.id),
          where("idUsuario", "==", usuario.uid)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (docSnap) => {
          await deleteDoc(doc(db, "bzmParticipacaoAgenda", docSnap.id));
        });
      } else {
        // Adicionar participação
        await addDoc(collection(db, "bzmParticipacaoAgenda"), {
          idAgenda: eventoSelecionado.id,
          idUsuario: usuario.uid,
        });
      }
      setParticipacoes((prev) => ({
        ...prev,
        [eventoSelecionado.id]: !participando,
      }));
    } catch (error) {
      console.error("Erro ao atualizar participação:", error);
    }
  };

  const eventosDoDia = eventos[dataChave] || [];

  return (
    <ScreenWrapper title="Agenda de Eventos">
      <View style={styles.header}>
        <Text style={styles.subtitulo}>
          Eventos em {format(dataSelecionada, "dd 'de' MMMM", { locale: ptBR })}
        </Text>
        {usuarioAutorizado && (
          <TouchableOpacity
            style={styles.botaoNovo}
            onPress={() => {
              setFormVisivel(!formVisivel);
              setErrosNovo({ titulo: false, hora: false, local: false });
            }}
          >
            <Text style={styles.botaoTexto}>+ Novo Evento</Text>
          </TouchableOpacity>
        )}
      </View>

      {formVisivel && (
        <Animated.View style={[styles.formulario, { transform: [{ translateX: shakeAnimation }] }]}>
          <TextInput
            style={[styles.input, errosNovo.titulo && styles.inputErro]}
            placeholder="Título *"
            value={novoEvento.titulo}
            onChangeText={(text) => {
              setNovoEvento({ ...novoEvento, titulo: text });
              if (text) setErrosNovo((prev) => ({ ...prev, titulo: false }));
            }}
          />
          <TextInput
            style={[styles.input, errosNovo.hora && styles.inputErro]}
            placeholder="Hora (ex: 14:00) *"
            value={novoEvento.hora}
            onChangeText={(text) => {
              setNovoEvento({ ...novoEvento, hora: text });
              if (text) setErrosNovo((prev) => ({ ...prev, hora: false }));
            }}
          />
          <TextInput
            style={[styles.input, errosNovo.local && styles.inputErro]}
            placeholder="Local *"
            value={novoEvento.local}
            onChangeText={(text) => {
              setNovoEvento({ ...novoEvento, local: text });
              if (text) setErrosNovo((prev) => ({ ...prev, local: false }));
            }}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Descrição"
            multiline
            numberOfLines={3}
            value={novoEvento.descricao}
            onChangeText={(text) =>
              setNovoEvento({ ...novoEvento, descricao: text })
            }
          />
          <TouchableOpacity
            style={styles.botaoSalvar}
            onPress={salvarNovoEvento}
          >
            <Text style={styles.botaoTexto}>Salvar Evento</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <CalendarPicker
        onDateChange={(date) => setDataSelecionada(new Date(date))}
        selectedStartDate={dataSelecionada}
        locale="pt"
        weekdays={["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]}
        months={[
          "Janeiro",
          "Fevereiro",
          "Março",
          "Abril",
          "Maio",
          "Junho",
          "Julho",
          "Agosto",
          "Setembro",
          "Outubro",
          "Novembro",
          "Dezembro",
        ]}
        todayBackgroundColor="#f2f2f2"
        selectedDayColor="#4f46e5"
        selectedDayTextColor="#fff"
        width={Math.min(width - 40, 460)}
        scaleFactor={Platform.OS === 'web' ? 500 : 375}
      />


      <View style={styles.eventos}>
        {eventosDoDia.length === 0 ? (
          <Text style={styles.semEvento}>Nenhum evento para este dia.</Text>
        ) : (
          eventosDoDia.map((evento) => (
            <TouchableOpacity
              key={evento.id}
              style={styles.cartaoEvento}
              onPress={() => abrirDetalhesEvento(evento)}
            >
              <Text style={styles.eventoTitulo}>{evento.titulo}</Text>
              <Text style={styles.eventoInfo}>
                {evento.hora} - {evento.local}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <Modal visible={modalAberta} animationType="slide" transparent>
        <View style={styles.modalFundo}>
          <Animated.View style={[styles.modalConteudo, { transform: [{ translateX: shakeAnimation }] }]}>
            <TouchableOpacity
              style={styles.botaoFecharModal}
              onPress={() => {
                setModalAberta(false);
                setErrosEdicao({ titulo: false, hora: false, local: false });
              }}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          {eventoSelecionado && (
  <>
    {editando ? (
      <>
        <TextInput
          style={[styles.input, errosEdicao.titulo && styles.inputErro]}
          placeholder="Título *"
          value={eventoSelecionado.titulo}
          onChangeText={(text) => {
            setEventoSelecionado({ ...eventoSelecionado, titulo: text });
            if (text) setErrosEdicao((prev) => ({ ...prev, titulo: false }));
          }}
        />
        <TextInput
          style={[styles.input, errosEdicao.hora && styles.inputErro]}
          placeholder="Hora (ex: 14:00) *"
          value={eventoSelecionado.hora}
          onChangeText={(text) => {
            setEventoSelecionado({ ...eventoSelecionado, hora: text });
            if (text) setErrosEdicao((prev) => ({ ...prev, hora: false }));
          }}
        />
        <TextInput
          style={[styles.input, errosEdicao.local && styles.inputErro]}
          placeholder="Local *"
          value={eventoSelecionado.local}
          onChangeText={(text) => {
            setEventoSelecionado({ ...eventoSelecionado, local: text });
            if (text) setErrosEdicao((prev) => ({ ...prev, local: false }));
          }}
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
        <Text style={styles.eventoDescricao}>
          {eventoSelecionado.descricao}
        </Text>

        {/* Botão Participar */}
        <TouchableOpacity
          style={[
            styles.botaoSalvar,
            {
              marginTop: 10,
              backgroundColor: participacoes?.[eventoSelecionado.id]
                ? "#dc2626"
                : "#16a34a",
            },
          ]}
          onPress={toggleParticipacao}
        >
          <Text style={styles.botaoTexto}>
            {participacoes?.[eventoSelecionado.id]
              ? "Remover participação"
              : "Participar como voluntário"}
          </Text>
        </TouchableOpacity>

        {/* Apenas se admin */}
        {usuarioAutorizado && (
  <>
    <TouchableOpacity style={styles.botaoEditar} onPress={() => setEditando(true)}>
      <Text style={styles.botaoTexto}>Editar</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.botaoCancelar, { marginTop: 10 }]}
      onPress={async () => {
        Alert.alert(
          "Excluir evento",
          "Deseja realmente excluir este evento?",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Excluir",
              style: "destructive",
              onPress: async () => {
                try {
                  await deleteDoc(doc(db, "bzmagenda", eventoSelecionado.id));
                  setModalAberta(false);
                } catch (error) {
                  Alert.alert("Erro", "Não foi possível excluir.");
                  console.error("Erro ao excluir:", error);
                }
              },
            },
          ]
        );
      }}
    >
      <Text style={[styles.botaoTexto, { color: "#dc2626" }]}>Excluir</Text>
    </TouchableOpacity>
  </>
)}

      </>
    )}
  </>
)}

          </Animated.View>
        </View>
      </Modal>
    </ScreenWrapper>
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
  modalConteudo: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    ...(Platform.OS === 'web' && {
      maxWidth: 450,
    }),
  },
  inputErro: {
    borderColor: "#dc2626",
    borderWidth: 1.5,
  },
  botaoFecharModal: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 20,
    padding: 4,
  },
});

 
