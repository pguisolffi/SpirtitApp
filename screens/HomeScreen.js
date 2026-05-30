import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { width } from '../constants/Layout';
import ScreenWrapper from '../components/ScreenWrapper';

export default function HomeScreen() {
  return (
    <ScreenWrapper title="Bem-vindo" showBackButton={false}>
      <Text style={styles.title}>Bem-vindo!</Text>

      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardText}>📅 Marcar Consulta</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardText}>📍 Avisar Presença Hoje</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardText}>🗒️ Minhas Orientações</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.05,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: width * 0.06,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#007AFF',
    padding: 20,
    marginVertical: 10,
    borderRadius: 10,
  },
  cardText: {
    color: '#fff',
    fontSize: width * 0.045,
    textAlign: 'center',
  },
});
