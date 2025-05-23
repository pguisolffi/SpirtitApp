import React, { useState, useEffect } from "react";
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
  Platform
} from "react-native";
import CalendarPicker from "react-native-calendar-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { auth } from "./firebaseConfig"; // Certifique-se de importar corretamente
import {collection,doc,getDocs,addDoc,updateDoc,deleteDoc,getDoc,query,where,onSnapshot,} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';


const { width, height } = Dimensions.get("window");

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
          const perfil = dados.perfil || "";
  
          console.log("Perfil encontrado:", perfil);
  
          const perfis = perfil.split(",").map((p) => p.trim().toUpperCase());
          const isAdmin = perfis.includes("ADMINISTRADOR");
  
          setUsuarioAutorizado(isAdmin);
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
    if (!titulo || !hora || !local) return;

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
      setFormVisivel(false);
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
    }
  };

  const abrirDetalhesEvento = async (evento) => {
    setEventoSelecionado(evento);
    setModalAberta(true);
    setEditando(false);

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
    try {
      await updateDoc(doc(db, "bzmagenda", id), {
        titulo,
        hora,
        local,
        descricao,
      });
      setEditando(false);
      setModalAberta(false);
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
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{
  alignSelf: 'center',
  width: '100%',
  maxWidth: Platform.OS === 'web' ? 600 : '100%'
}}>

  <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
<TouchableOpacity onPress={() => router.back()}>
  <ArrowLeft size={24} color="#333" />
</TouchableOpacity>
</View>

      <Text style={styles.titulo}>Agenda de Eventos</Text>

      <View style={styles.header}>
        <Text style={styles.subtitulo}>
          Eventos em {format(dataSelecionada, "dd 'de' MMMM", { locale: ptBR })}
        </Text>
        {usuarioAutorizado && (
          <TouchableOpacity
            style={styles.botaoNovo}
            onPress={() => setFormVisivel(!formVisivel)}
          >
            <Text style={styles.botaoTexto}>+ Novo Evento</Text>
          </TouchableOpacity>
        )}
      </View>

      {formVisivel && (
        <View style={styles.formulario}>
          <TextInput
            style={styles.input}
            placeholder="Título"
            value={novoEvento.titulo}
            onChangeText={(text) =>
              setNovoEvento({ ...novoEvento, titulo: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Hora (ex: 14:00)"
            value={novoEvento.hora}
            onChangeText={(text) =>
              setNovoEvento({ ...novoEvento, hora: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Local"
            value={novoEvento.local}
            onChangeText={(text) =>
              setNovoEvento({ ...novoEvento, local: text })
            }
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
        </View>
      )}
      <View style={{ alignSelf: 'center', width: Platform.OS === 'web' ? 400 : '100%' }}>
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
      />
      </View>

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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
container: {
  paddingTop: Platform.OS === 'web' ? 20 : height * 0.1,
  paddingHorizontal: Platform.OS === 'web' ? 12 : 16,
  backgroundColor: "#fff",
  flex: 1,
  width: "100%",
  alignSelf: "center",
  maxWidth: Platform.OS === 'web' ? 1000 : "100%",  // ← aumenta o conteúdo no web
},



titulo: {
  fontSize: Platform.OS === 'web' ? 32 : 26,
  fontWeight: "bold",
  marginBottom: 16,
  textAlign: "center",
},
subtitulo: {
  fontSize: Platform.OS === 'web' ? 14 : 18,
  fontWeight: "600",
},
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
botaoNovo: {
  backgroundColor: "#4f46e5",
  paddingHorizontal: Platform.OS === 'web' ? 8 : 12,
  paddingVertical: Platform.OS === 'web' ? 6 : 8,
  borderRadius: Platform.OS === 'web' ? 4 : 6,
},
  botaoSalvar: {
    backgroundColor: "#16a34a",
    padding: Platform.OS === 'web' ? 12 : 10,
    borderRadius: 6,
    marginTop: 8,
  },
  botaoEditar: {
    backgroundColor: "#eab308",
    padding: Platform.OS === 'web' ? 12 : 10,
    borderRadius: 6,
    marginTop: 10,
  },
  botaoCancelar: {
    backgroundColor: "#e5e7eb",
    padding: Platform.OS === 'web' ? 12 : 10,
    borderRadius: 6,
  },
  botaoTexto: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: Platform.OS === 'web' ? 16 : 14,
  },
  formulario: {
    backgroundColor: "#f3f4f6",
    padding: Platform.OS === 'web' ? 20 : 16,
    borderRadius: 8,
    marginBottom: 16,
  },
input: {
  borderWidth: 1,
  borderColor: "#ccc",
  padding: Platform.OS === 'web' ? 8 : 12,
  borderRadius: Platform.OS === 'web' ? 4 : 6,
  marginBottom: Platform.OS === 'web' ? 6 : 8,
  fontSize: Platform.OS === 'web' ? 14 : 16,
},
textarea: {
  height: Platform.OS === 'web' ? 60 : 100,
  textAlignVertical: "top",
},
  eventos: {
    marginTop: 16,
  },
cartaoEvento: {
  borderWidth: 1,
  borderColor: "#e5e7eb",
  padding: Platform.OS === 'web' ? 8 : 12,
  borderRadius: Platform.OS === 'web' ? 4 : 6,
  marginBottom: Platform.OS === 'web' ? 6 : 8,
  backgroundColor: "#fff",
  elevation: 1,
},
  eventoTitulo: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    fontWeight: "bold",
  },
  eventoInfo: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: "#4b5563",
  },
  eventoDescricao: {
    marginTop: 4,
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: "#374151",
  },
  semEvento: {
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 8,
  },
  modalFundo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
modalConteudo: {
  backgroundColor: "#fff",
  padding: Platform.OS === 'web' ? 16 : 24,
  borderRadius: Platform.OS === 'web' ? 8 : 10,
  width: Platform.OS === 'web' ? '60%' : '90%',
  maxWidth: Platform.OS === 'web' ? 400 : undefined,
},
});


 