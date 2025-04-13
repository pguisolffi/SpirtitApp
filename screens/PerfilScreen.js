// screens/PerfilScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';

export default function PerfilScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Meu Perfil</Text>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Nome:</Text>
        <Text style={styles.value}>João da Silva</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>joao@email.com</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Telefone:</Text>
        <Text style={styles.value}>(48) 99999-9999</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Endereço:</Text>
        <Text style={styles.value}>Rua das Flores, 123</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Editar Perfil" onPress={() => {}} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoBox: {
    marginBottom: 15,
  },
  label: {
    fontWeight: 'bold',
    color: '#555',
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 30,
  },
});
