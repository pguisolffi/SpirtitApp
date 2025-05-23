import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function OracaoViewerScreen() {
  const { titulo, texto } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Botão de Voltar */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#6A5ACD" />
        </TouchableOpacity>

        {/* Título */}
        <Text style={styles.title}>{titulo}</Text>

        {/* Texto da oração */}
        <Text style={styles.texto}>{texto}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f9f9f9', 
    paddingTop: height * 0.05, 
    alignItems: 'center' 
  },
  content: {
    width: '90%',
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
    paddingBottom: 30
  },
  backButton: { 
    marginBottom: 10 
  },
  title: { 
    fontSize: Platform.OS === 'web' ? 28 : 26,
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginTop: 20, 
    marginBottom: 15, 
    color: '#333' 
  },
  texto: { 
    fontSize: Platform.OS === 'web' ? 20 : 18,
    lineHeight: Platform.OS === 'web' ? 32 : 28,
    textAlign: 'justify', 
    color: '#444' 
  },
});
