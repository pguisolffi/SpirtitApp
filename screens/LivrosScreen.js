import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

const { width, height } = Dimensions.get('window');

export default function LivrosScreen() {
  const [busca, setBusca] = useState('');
  const [livros, setLivros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [livroExpandido, setLivroExpandido] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const carregarLivros = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'bzmLivro'));
        const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setLivros(lista);
      } catch (error) {
        console.error('❌ Erro ao buscar livros:', error);
      } finally {
        setCarregando(false);
      }
    };
  
    carregarLivros();
  }, []);

  const livrosFiltrados = livros.filter(
    (livro) =>
      livro.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      livro.autor.toLowerCase().includes(busca.toLowerCase())
  );

  const abrirLivro = (livro) => {
    router.push({pathname: '/Rota_LeitorPDFScreen',
      params: {
        titulo: livro.titulo,
        pdfUrl: livro.linkPDF,
        idLivro: livro.id,
      },
    });
  
  };

  const baixarLivro = (livro) => {
    alert(`Iniciar download de: ${livro.titulo}`);
  };

  const renderItem = ({ item }) => {
    const expandido = livroExpandido === item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setLivroExpandido(expandido ? null : item.id)}
        activeOpacity={0.8}
      >
        <Text style={styles.titulo}>{item.titulo}</Text>
        <Text style={styles.autor}>Autor: {item.autor}</Text>

        {expandido && (
          <View style={styles.botoes}>
            <TouchableOpacity onPress={() => abrirLivro(item)} style={styles.botaoLer}>
              <Icon name="eye" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => baixarLivro(item)} style={styles.botaoBaixar}>
              <Icon name="download" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (carregando) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6A5ACD" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Buscar por título ou autor"
        value={busca}
        onChangeText={setBusca}
        style={styles.input}
      />
      <FlatList
        data={livrosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum livro encontrado.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: height * 0.1,
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    backgroundColor: '#f7f7f7',
  },
  input: {
    height: height * 0.06,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.02,
    fontSize: width * 0.04,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: height * 0.015,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  titulo: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  autor: {
    fontSize: width * 0.038,
    color: '#555',
  },
  botoes: {
    flexDirection: 'row',
    marginTop: height * 0.015,
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
  },
  emptyText: {
    textAlign: 'center',
    marginTop: height * 0.1,
    fontSize: width * 0.04,
    color: '#777',
  },
});
