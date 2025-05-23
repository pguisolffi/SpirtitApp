import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EstatisticasScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📊 Relatórios e Estatísticas</Text>

      {cards.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.card}
          onPress={() => router.push(item.route)}
        >
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDesc}>{item.desc}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
    </SafeAreaView>
  );
}

const cards = [
  { title: '📅 Por Período', desc: 'Atendimentos por semana ou mês', route: '/Rota_RelatorioPorPeriodo' },
  { title: '👤 Por Paciente', desc: 'Histórico e volume por paciente', route: '/estatisticas/paciente' },
  { title: '🧑‍⚕️ Por Orientador', desc: 'Ranking e volume por orientador', route: '/estatisticas/orientador' },
  { title: '🏠 Por Sala', desc: 'Distribuição de atendimentos por sala', route: '/estatisticas/sala' },
  { title: '💬 Queixas Frequentes', desc: 'Mais recorrentes e nuvem de palavras', route: '/estatisticas/queixas' },
  { title: '📌 Por Status', desc: 'Quantidade por status', route: '/estatisticas/status' },
];

const styles = StyleSheet.create({
  container: { paddingTop:20, padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardDesc: { fontSize: 14, color: '#666', marginTop: 5 },
});