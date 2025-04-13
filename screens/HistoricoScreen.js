import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const historico = [
  { id: '1', data: '10/04/2025', queixa: 'Dor nas costas', orientacao: 'Alongar diariamente' },
  { id: '2', data: '01/03/2025', queixa: 'Ansiedade', orientacao: 'Meditação diária' },
];

export default function HistoricoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico</Text>
      <FlatList
        data={historico}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <Text style={styles.date}>{item.data}</Text>
            <Text>Queixa: {item.queixa}</Text>
            <Text>Orientação: {item.orientacao}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  entry: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
  },
  date: {
    fontWeight: 'bold',
  },
});
