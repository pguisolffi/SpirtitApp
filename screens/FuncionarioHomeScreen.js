import React, { useState, useEffect } from 'react';
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
import { getAuth,signOut  } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import dev from '../gambiarrasTemporarias/dev';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const menuItems = [
  { label: 'Novo Atendimento', icon: 'person-add-outline', route: '/Rota_NovoAtendimento' },
  { label: 'Fila de Espera', icon: 'people-outline', route: '/Rota_FilaDeEsperaScreen' },
  { label: 'Próximos Eventos', icon: 'calendar-outline', route: '/Rota_AgendaScreen' },
  { label: 'Voluntários', icon: 'list-circle-outline', route: '/Rota_EscalaVoluntarios' },
  { label: 'Biblioteca', icon: 'library-outline', route: '/Rota_Livros' },
  { label: 'Orações', icon: 'heart-outline', route: '/Rota_OracoesScreen'},
  { label: 'Cursos e Palestras', icon: 'book-outline', route: '/Rota_CursosPalestrasScreen' },
  { label: 'DEV', icon: 'build-outline', action: dev },
];

const drawerItems = [
  { label: 'Conta', icon: 'person-outline', action: 'conta' },
  { label: 'Usuários', icon: 'people', action: 'configuracoes' },
  { label: 'Sair', icon: 'log-out-outline', action: 'sair' },
];


export default function HomeFuncionario() {
  const [primeiroNome, setPrimeiroNome] = useState('Amigo');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnimation = useState(new Animated.Value(-width * 0.6))[0];
  const router = useRouter();

  useEffect(() => {
    const buscarNomeDoUsuario = async () => {
      const auth = getAuth();
      const email = auth.currentUser?.email;

      if (!email) return;

      try {
        const q = query(collection(db, 'bzmpessoa'), where('email', '==', email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const dados = snapshot.docs[0].data();
          const nomeCompleto = dados.nome || 'Amigo';
          const primeiro = nomeCompleto.split(' ')[0];
          setPrimeiroNome(primeiro);
        }
      } catch (err) {
        console.error('Erro ao buscar nome no Firestore:', err);
      }
    };

    buscarNomeDoUsuario();
  }, []);

  const handlePress = async (item) => {
    if (item.action) {
      await item.action();
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

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnimation, {
      toValue: -width * 0.6,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setDrawerOpen(false);
    });
  };

  const handleDrawerItemPress = async (action) => {
    console.log('Clicou em', action);
    closeDrawer();
  
    if (action === 'sair') {
      try {
        const auth = getAuth();
        await signOut(auth);
        router.replace('/login'); // Volta para o login
      } catch (error) {
        console.error('Erro ao deslogar:', error);
      }
    } else if (action === 'conta') {
      router.push('/Rota_ContaScreen');
    } else if (action === 'configuracoes') {
      router.push('/Rota_GerenciarUsuariosScreen');
    }
  };
  

  return (
    <View style={styles.container}>
      {/* Botão de abrir Drawer */}
      <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
        <Ionicons name="menu" size={28} color="#333" />
      </TouchableOpacity>
  
      {/* Drawer lateral */}
      {drawerOpen && (
        <TouchableOpacity style={styles.overlay} onPress={closeDrawer} activeOpacity={1}>
          <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnimation }] }]}>
            {drawerItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.drawerItem}
                onPress={() => handleDrawerItemPress(item.action)}
              >
                <Ionicons name={item.icon} size={24} color="#333" />
                <Text style={styles.drawerText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableOpacity>
      )}
  
      {/* Conteúdo da Home */}
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
    paddingTop: height * 0.05, // Aproximadamente 4% da altura — bem mais perto do topo
    paddingHorizontal: width * 0.04,
  }, 
  menuButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 20,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.6,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 30,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  drawerText: {
    fontSize: 18,
    marginLeft: 10,
    color: '#333',
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 30,
  },
  subtitle: {
    fontSize: width * 0.04,
    textAlign: 'center',
    color: '#666',
    marginBottom: height * 0.03,
  },
  gridContainer: {
    paddingBottom: height * 0.1,
    marginTop: 8,
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
