import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import dev from '../gambiarrasTemporarias/dev';

const { width, height } = Dimensions.get('window');

const menuItems = [
  { label: 'Novo Atendimento', icon: 'person-add-outline', route: '/Rota_NovoAtendimento' },
  { label: 'Fila de Espera', icon: 'people-outline', route: '/Rota_FilaDeEsperaScreen' },
  { label: 'Próximos Eventos', icon: 'calendar-outline', route: '/Rota_AgendaScreen' },
  { label: 'Voluntários', icon: 'list-circle-outline', route: '/Rota_EscalaVoluntarios' },
  { label: 'Biblioteca', icon: 'library-outline', route: '/Rota_Livros' },
  { label: 'Orações', icon: 'heart-outline', route: null },
  { label: 'Cursos e Palestras', icon: 'book-outline', route: null },
  { label: 'DEV', icon: 'build-outline', action: dev },
];

export default function HomeFuncionario() {
  const router = useRouter();
  const [primeiroNome, setPrimeiroNome] = useState('Amigo');
  
  useEffect(() => {
    const buscarNomeDoUsuario = async () => {
      const auth = getAuth();
      const email = auth.currentUser?.email;
  
      console.log('🟢 Email logado:', email);
  
      if (!email) return;
  
      try {
        const q = query(collection(db, 'bzmpessoa'), where('email', '==', email));
        const snapshot = await getDocs(q);
  
        console.log('📦 Snapshot size:', snapshot.size);
  
        if (!snapshot.empty) {
          const dados = snapshot.docs[0].data();
          console.log('👤 Dados do Firestore:', dados);
  
          const nomeCompleto = dados.nome || 'Amigo';
          const primeiro = nomeCompleto.split(' ')[0];
          setPrimeiroNome(primeiro);
        } else {
          console.warn('⚠️ Nenhum documento encontrado com esse email');
        }
      } catch (err) {
        console.error('❌ Erro ao buscar nome no Firestore:', err);
      }
    };
  
    buscarNomeDoUsuario();
  }, []);
  
  const handlePress = async (item) => {
    if (item.action) {
      console.log(`🛠 Executando: ${item.label}`);
      await item.action(); // agora sim, execução no clique
    } else if (item.route) {
      router.push(item.route);
    }
  };
  

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => handlePress(item)}
    >
      <Ionicons name={item.icon} size={width * 0.1} color="#fff" style={styles.icon} />
      <Text style={styles.cardText}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👋 Olá, {primeiroNome}!</Text>
      <Text style={styles.subtitle}>Tenha um excelente dia de trabalho 🙏</Text>
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.label}
        numColumns={2}
        renderItem={renderItem}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f8',
    paddingTop: height * 0.1,
    paddingHorizontal: width * 0.04,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: width * 0.04,
    textAlign: 'center',
    color: '#666',
    marginBottom: height * 0.03,
  },
  gridContainer: {
    paddingBottom: height * 0.1,
  },
  card: {
    flex: 1,
    margin: width * 0.02,
    backgroundColor: '#6A5ACD',
    borderRadius: 12,
    padding: width * 0.04,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: height * 0.18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginBottom: height * 0.01,
  },
  cardText: {
    fontSize: width * 0.04,
    color: '#fff',
    textAlign: 'center',
  },
});