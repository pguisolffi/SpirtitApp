import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';  

const { width, height } = Dimensions.get('window');

export default function HomeFuncionario() {
      const router = useRouter();
  return (
    <View style={styles.container}>
      {/* ScrollView com as ações principais */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Bem-vindo, Patric!</Text>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/Rota_NovoAtendimento')}>
          <Ionicons name="person-add-outline" size={width * 0.08} color="#fff" />
          <Text style={styles.cardText}>Novo Atendimento</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons name="people-outline" size={width * 0.08} color="#fff" />
          <Text style={styles.cardText}>Fila de Espera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons name="calendar-outline" size={width * 0.08} color="#fff" />
          <Text style={styles.cardText}>Voluntários do Dia</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons name="library-outline" size={width * 0.08} color="#fff" />
          <Text style={styles.cardText}>Biblioteca</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons name="heart-outline" size={width * 0.08} color="#fff" />
          <Text style={styles.cardText}>Orações</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons name="book-outline" size={width * 0.08} color="#fff" />
          <Text style={styles.cardText}>Cursos e Palestras</Text>
        </TouchableOpacity>


      </ScrollView>

      {/*RODAPÉ*/}
      <View style={styles.bottomTab}>

      <TouchableOpacity style={styles.tabButton}>
          <Ionicons name="home-outline" size={width * 0.08} color="#007AFF" />
          <Text style={styles.tabText}>Início</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabButton}>
          <Ionicons name="person-outline" size={width * 0.08} color="#007AFF" />
          <Text style={styles.tabText}>Conta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton}>
          <Ionicons name="settings-outline" size={width * 0.08} color="#007AFF" />
          <Text style={styles.tabText}>Configurações</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton}>
          <Ionicons name="document-text-outline" size={width * 0.08} color="#007AFF" />
          <Text style={styles.tabText}>Relatórios</Text>
        </TouchableOpacity>
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: width * 0.05,
    paddingBottom: height * 0.1, // Adiciona espaço para o menu inferior
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: height * 0.03,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    padding: width * 0.05,
    marginVertical: height * 0.015,
    borderRadius: 10,
    alignItems: 'center',
  },
  cardText: {
    color: '#fff',
    fontSize: width * 0.045,
    marginLeft: width * 0.05,
  },
  bottomTab: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: height * 0.02,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  tabButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: width * 0.03,
    color: '#007AFF',
    marginTop: 5,
  },
});
