import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet, Dimensions, Platform, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAuth } from 'firebase/auth';
import { db } from './firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, doc, where, query } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function LivrosScreen() {
  const [busca, setBusca] = useState('');
  const [livros, setLivros] = useState([]);
  const [livroExpandido, setLivroExpandido] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [tabSelecionada, setTabSelecionada] = useState(0);
  const [perfilUsuario, setPerfilUsuario] = useState('');
  const auth = getAuth();
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoAutor, setNovoAutor] = useState('');
  const [novoLinkPDF, setNovoLinkPDF] = useState('');
  const [novoPrecoVenda, setNovoPrecoVenda] = useState('');
  const [novoEstoque, setNovoEstoque] = useState('');
  const [novoTemPDF, setNovoTemPDF] = useState(false);
  const [novoVendaDisponivel, setNovoVendaDisponivel] = useState(false);
  const [novoEmprestimoDisponivel, setNovoEmprestimoDisponivel] = useState(false);

  useEffect(() => {
    carregarLivros();
    verificarPermissao();
  }, []);

  const carregarLivros = async () => {
    const snapshot = await getDocs(collection(db, 'bzmLivro'));
    const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setLivros(lista);
  };

  const verificarPermissao = async () => {
    const user = auth.currentUser;
    if (user) {
      const q = query(collection(db, 'bzmusuario'), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const dados = querySnapshot.docs[0].data();
        setPerfilUsuario(dados.perfil);
      }
    }
  };

  const filtroLivros = () => {
    const filtrados = livros.filter(
      (livro) => livro.titulo.toLowerCase().includes(busca.toLowerCase()) || livro.autor.toLowerCase().includes(busca.toLowerCase())
    );
    if (tabSelecionada === 0) return filtrados.filter((livro) => livro.temPDF);
    if (tabSelecionada === 1) return filtrados.filter((livro) => livro.emprestimoDisponivel);
    if (tabSelecionada === 2) return filtrados.filter((livro) => livro.vendaDisponivel);
    return filtrados;
  };

  const abrirLivroPDF = (livro) => {
    router.push({
      pathname: '/Rota_LeitorPDFScreen',
      params: { pdfUrl: livro.linkPDF, titulo: livro.titulo },
    });
  };

  const baixarPDF = async (livro) => {
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = livro.linkPDF;
      link.download = `${livro.titulo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const fileUri = FileSystem.documentDirectory + `${livro.titulo}.pdf`;
      const downloadResumable = FileSystem.createDownloadResumable(livro.linkPDF, fileUri);
      await downloadResumable.downloadAsync();
      await Sharing.shareAsync(fileUri);
    }
  };

  const renderItem = ({ item }) => {
    const expandido = livroExpandido === item.id;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setLivroExpandido(expandido ? null : item.id)}
      >
        <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <Text style={styles.titulo}>{item.titulo}</Text>
          <Text style={styles.autor}>Autor: {item.autor}</Text>
        </View>

        {expandido && (
          <View style={styles.botoes}>
            {item.temPDF && (
              <TouchableOpacity style={styles.botaoLer} onPress={() => abrirLivroPDF(item)}>
                <Icon name="eye" size={18} color="#fff" />
              </TouchableOpacity>
            )}
            {item.temPDF && (
              <TouchableOpacity style={styles.botaoBaixar} onPress={() => baixarPDF(item)}>
                <Icon name="download" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const adicionarLivro = async () => {
  if (!novoTitulo.trim() || !novoAutor.trim()) {
    Alert.alert('Erro', 'Preencha o título e o autor.');
    return;
  }

  try {
    await addDoc(collection(db, 'bzmLivro'), {
      titulo: novoTitulo,
      autor: novoAutor,
      linkPDF: novoLinkPDF || '',
      precoVenda: novoPrecoVenda ? parseFloat(novoPrecoVenda) : 0,
      estoque: novoEstoque ? parseInt(novoEstoque) : 0,
      temPDF: novoTemPDF,
      vendaDisponivel: novoVendaDisponivel,
      emprestimoDisponivel: novoEmprestimoDisponivel,
      emprestado: false,
      emprestadoPara: '',
      dataEmprestimo: '',
      dataDevolucaoPrevista: '',
    });

    Alert.alert('Sucesso', 'Livro adicionado!');
    setModalVisible(false);

    // Limpar campos:
    setNovoTitulo('');
    setNovoAutor('');
    setNovoLinkPDF('');
    setNovoPrecoVenda('');
    setNovoEstoque('');
    setNovoTemPDF(false);
    setNovoVendaDisponivel(false);
    setNovoEmprestimoDisponivel(false);

    // Atualiza a lista:
    const snapshot = await getDocs(collection(db, 'bzmLivro'));
    const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setLivros(lista);
  } catch (error) {
    console.error('Erro ao adicionar livro:', error);
    Alert.alert('Erro', 'Não foi possível adicionar o livro.');
  }
};
  

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📚 Biblioteca</Text>
        </View>

        <SegmentedControl
          values={['PDF', 'Empréstimo', 'Venda']}
          selectedIndex={tabSelecionada}
          onChange={(e) => setTabSelecionada(e.nativeEvent.selectedSegmentIndex)}
          style={styles.segmented}
        />

        <TextInput
          placeholder="Buscar por título ou autor"
          value={busca}
          onChangeText={setBusca}
          style={styles.input}
        />

        <FlatList
          data={filtroLivros()}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum livro encontrado.</Text>}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

<Modal
  visible={modalVisible}
  transparent
  onRequestClose={() => setModalVisible(false)}
  animationType="slide"
>
  <View style={styles.modalContainer}>
    <ScrollView contentContainerStyle={styles.modalContent}>
      <Text style={styles.modalTitle}>Adicionar Novo Livro</Text>

      <TextInput
        style={styles.modalInput}
        placeholder="Título"
        value={novoTitulo}
        onChangeText={setNovoTitulo}
      />
      <TextInput
        style={styles.modalInput}
        placeholder="Autor"
        value={novoAutor}
        onChangeText={setNovoAutor}
      />
      <TextInput
        style={styles.modalInput}
        placeholder="Link do PDF"
        value={novoLinkPDF}
        onChangeText={setNovoLinkPDF}
      />
      <TextInput
        style={styles.modalInput}
        placeholder="Preço de Venda"
        keyboardType="numeric"
        value={novoPrecoVenda}
        onChangeText={setNovoPrecoVenda}
      />
      <TextInput
        style={styles.modalInput}
        placeholder="Estoque"
        keyboardType="numeric"
        value={novoEstoque}
        onChangeText={setNovoEstoque}
      />

      <View style={styles.switchRow}>
        <Text>Tem PDF:</Text>
        <TouchableOpacity onPress={() => setNovoTemPDF(!novoTemPDF)}>
          <Ionicons name={novoTemPDF ? "checkmark-circle" : "ellipse-outline"} size={28} color={novoTemPDF ? "#22c55e" : "#ccc"} />
        </TouchableOpacity>
      </View>

      <View style={styles.switchRow}>
        <Text>Disponível para Venda:</Text>
        <TouchableOpacity onPress={() => setNovoVendaDisponivel(!novoVendaDisponivel)}>
          <Ionicons name={novoVendaDisponivel ? "checkmark-circle" : "ellipse-outline"} size={28} color={novoVendaDisponivel ? "#22c55e" : "#ccc"} />
        </TouchableOpacity>
      </View>

      <View style={styles.switchRow}>
        <Text>Disponível para Empréstimo:</Text>
        <TouchableOpacity onPress={() => setNovoEmprestimoDisponivel(!novoEmprestimoDisponivel)}>
          <Ionicons name={novoEmprestimoDisponivel ? "checkmark-circle" : "ellipse-outline"} size={28} color={novoEmprestimoDisponivel ? "#22c55e" : "#ccc"} />
        </TouchableOpacity>
      </View>

      <View style={styles.modalButtons}>
        <TouchableOpacity style={styles.modalButton} onPress={adicionarLivro}>
          <Text style={styles.modalButtonText}>Salvar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalButton, { backgroundColor: '#ccc' }]}
          onPress={() => setModalVisible(false)}
        >
          <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </View>
</Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: height * 0.05,
    flex: 1,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 800,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: Platform.OS === 'web' ? 28 : width * 0.05,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  segmented: {
    marginBottom: 12,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  titulo: {
    fontSize: Platform.OS === 'web' ? 20 : width * 0.045,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  autor: {
    fontSize: Platform.OS === 'web' ? 18 : width * 0.038,
    color: '#555',
  },
  botoes: {
    flexDirection: 'row',
    marginTop: 8,
  },
  botaoLer: {
    backgroundColor: '#6A5ACD',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  botaoBaixar: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
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
  emptyText: {
    marginTop: 20,
    color: '#777',
    textAlign: 'center',
  },
modalContainer: {
  paddingTop: height * 0.06,
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContent: {
  backgroundColor: '#fff',
  padding: 20,
  borderRadius: 12,
  width: '85%',
},
modalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 15,
  textAlign: 'center',
},
modalInput: {
  backgroundColor: '#f1f1f1',
  borderRadius: 8,
  padding: 10,
  marginBottom: 10,
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 10,
},
modalButton: {
  flex: 1,
  backgroundColor: '#6A5ACD',
  borderRadius: 8,
  padding: 10,
  marginHorizontal: 5,
  alignItems: 'center',
},
modalButtonText: {
  color: '#fff',
  fontWeight: 'bold',
},
switchRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
}
});
