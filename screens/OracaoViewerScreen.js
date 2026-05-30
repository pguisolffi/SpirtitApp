// app/OracaoViewerScreen.js

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { width, height } from '../constants/Layout';

import ScreenWrapper from '../components/ScreenWrapper';

export default function OracaoViewerScreen() {
  const { titulo, texto } = useLocalSearchParams();
  const router = useRouter();

  return (
    <ScreenWrapper title={titulo} scrollable={true}>
      <Text style={styles.texto}>{texto}</Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', paddingTop: height * 0.05 },
  backButton: { position: 'absolute', top: 40, left: 20, zIndex: 10 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 15, color: '#333', paddingHorizontal: 20 },
  textContainer: { padding: 20 },
  texto: { fontSize: 18, lineHeight: 28, textAlign: 'justify', color: '#444' },
});
