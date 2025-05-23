import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function LeitorPDFScreen() {
  const { titulo, pdfUrl } = useLocalSearchParams();
  const [finalUrl, setFinalUrl] = useState('');
  const [carregando, setCarregando] = useState(true);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const gviewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`;
    setFinalUrl(gviewUrl);
  }, [pdfUrl]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.titulo}>{titulo}</Text>
      </View>

      {carregando && (
        <View style={styles.loaderOverlay}>
          <Animated.Text style={[styles.icone, { transform: [{ scale: scaleAnim }] }]}>📖</Animated.Text>
          <Text style={styles.loaderText}>Abrindo seu livro...</Text>
        </View>
      )}

      {Platform.OS === 'web' ? (
        <iframe
          src={finalUrl}
          style={styles.pdf}
          onLoad={() => setCarregando(false)}
          title="Visualizador PDF"
        />
      ) : (
        <WebView
          source={{ uri: finalUrl }}
          style={[styles.pdf, { opacity: carregando ? 0 : 1 }]}
          onLoadEnd={() => setCarregando(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
  },
  titulo: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#333',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  icone: { fontSize: 60 },
  loaderText: { marginTop: 12, fontSize: 18, color: '#555' },
  pdf: {
    flex: 1,
    width: '100%',
    height: height,
    border: 'none', // Só afeta web
  },
});
