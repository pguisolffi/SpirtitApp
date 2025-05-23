import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

if (!dayjs.extend) dayjs.extend = isoWeek;
else dayjs.extend(isoWeek);

export default function RelatorioPorPeriodo() {
  const [modo, setModo] = useState('semanal');
  const [dadosGrafico, setDadosGrafico] = useState({ labels: [], datasets: [{ data: [] }] });
  const [resumoPeriodo, setResumoPeriodo] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'bzmAtendimentoHist'));
      const agrupado = {};

      snapshot.forEach(doc => {
        const { data_hora } = doc.data();
        const data = dayjs(data_hora.toDate());

        const chave = modo === 'semanal'
          ? `${data.startOf('isoWeek').format('DD/MM')} a ${data.endOf('isoWeek').format('DD/MM')}`
          : data.format('MM/YYYY');

        const diaSemana = data.day();

        if (!agrupado[chave]) {
          agrupado[chave] = { segunda: 0, quinta: 0 };
        }

        if (diaSemana === 1) agrupado[chave].segunda++;
        else if (diaSemana === 4) agrupado[chave].quinta++;
      });

      const todasChaves = Object.keys(agrupado);
      const ultimas = todasChaves
        .sort((a, b) => {
          const parse = modo === 'semanal'
            ? x => dayjs(x.split(' a ')[0], 'DD/MM')
            : x => dayjs('01/' + x, 'DD/MM/YYYY');
          return parse(a).unix() - parse(b).unix();
        })
        .slice(-10);

      const segundaData = ultimas.map(label => agrupado[label].segunda);
      const quintaData = ultimas.map(label => agrupado[label].quinta);

      setDadosGrafico({
        labels: ultimas,
        datasets: [
          { data: segundaData },
          { data: quintaData },
        ],
        legend: ['Segunda', 'Quinta'],
      });

      const resumo = ultimas.map(label => ({
        periodo: label,
        segunda: agrupado[label].segunda,
        quinta: agrupado[label].quinta,
        total: agrupado[label].segunda + agrupado[label].quinta,
      }));

      setResumoPeriodo(resumo);
    };

    fetchData();
  }, [modo]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>📅 Atendimentos por {modo === 'semanal' ? 'Semana' : 'Mês'}</Text>

        <View style={styles.filtroContainer}>
          <TouchableOpacity
            style={[styles.filtroBotao, modo === 'semanal' && styles.filtroSelecionado]}
            onPress={() => setModo('semanal')}
          >
            <Text style={styles.filtroTexto}>Semanal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filtroBotao, modo === 'mensal' && styles.filtroSelecionado]}
            onPress={() => setModo('mensal')}
          >
            <Text style={styles.filtroTexto}>Mensal</Text>
          </TouchableOpacity>
        </View>

        {Platform.OS === 'web' ? (
          <>
            <Text style={styles.subTitle}>📋 Resumo por {modo === 'semanal' ? 'Semana' : 'Mês'}</Text>
            <FlatList
              data={resumoPeriodo}
              keyExtractor={item => item.periodo}
              renderItem={({ item }) => (
                <View style={styles.resumoCard}>
                  <Text style={styles.semana}>{item.periodo}</Text>
                  <Text style={styles.item}>🟣 Segunda: {item.segunda} atendimentos</Text>
                  <Text style={styles.item}>🔵 Quinta: {item.quinta} atendimentos</Text>
                  <Text style={styles.total}>🧮 Total: {item.total}</Text>
                </View>
              )}
            />
          </>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {/* Lazy load react-native-chart-kit only on mobile */}
              {React.createElement(require('react-native-chart-kit').BarChart, {
                data: {
                  labels: dadosGrafico.labels,
                  datasets: dadosGrafico.datasets,
                  legend: dadosGrafico.legend,
                },
                width: Math.max(width, dadosGrafico.labels.length * 80),
                height: 250,
                fromZero: true,
                showBarTops: false,
                withInnerLines: false,
                chartConfig: {
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  barPercentage: 0.5,
                  color: (opacity = 1) => `rgba(106, 90, 205, ${opacity})`,
                  labelColor: () => '#333',
                },
                style: { borderRadius: 16 },
              })}
            </ScrollView>

            <Text style={styles.subTitle}>📋 Resumo por {modo === 'semanal' ? 'Semana' : 'Mês'}</Text>
            {resumoPeriodo.map(item => (
              <View key={item.periodo} style={styles.resumoCard}>
                <Text style={styles.semana}>{item.periodo}</Text>
                <Text style={styles.item}>🟣 Segunda: {item.segunda} atendimentos</Text>
                <Text style={styles.item}>🔵 Quinta: {item.quinta} atendimentos</Text>
                <Text style={styles.total}>🧮 Total: {item.total}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
  container: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 15 },
  resumoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  semana: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  item: { fontSize: 14, color: '#333' },
  total: { fontSize: 15, color: '#000', fontWeight: 'bold', marginTop: 5 },
  filtroContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  filtroBotao: {
    backgroundColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  filtroSelecionado: { backgroundColor: '#6A5ACD' },
  filtroTexto: { color: '#333', fontWeight: 'bold' },
});
