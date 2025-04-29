// app/OracaoViewerScreen.js

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function OracaoViewerScreen() {
  const { titulo, texto } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Botão de Voltar */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#6A5ACD" />
      </TouchableOpacity>

      {/* Título */}
      <Text style={styles.title}>{titulo}</Text>

      {/* Texto da oração */}
      <ScrollView contentContainerStyle={styles.textContainer}>
        <Text style={styles.texto}>{texto}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', paddingTop: height * 0.05 },
  backButton: { position: 'absolute', top: 40, left: 20, zIndex: 10 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 15, color: '#333', paddingHorizontal: 20 },
  textContainer: { padding: 20 },
  texto: { fontSize: 18, lineHeight: 28, textAlign: 'justify', color: '#444' },
});
