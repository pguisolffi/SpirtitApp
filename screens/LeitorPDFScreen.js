import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { width, height } from '../constants/Layout';
import ScreenWrapper from '../components/ScreenWrapper';

// Only import WebView on native — importing it on web causes a crash
let WebView;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

export default function LeitorPDFScreen() {
  const { titulo, pdfUrl } = useLocalSearchParams();
  const [finalUrl, setFinalUrl] = useState('');
  const [carregando, setCarregando] = useState(true);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (pdfUrl) {
      const gviewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`;
      setFinalUrl(gviewUrl);
    }
  }, [pdfUrl]);

  useEffect(() => {
    const anim = Animated.loop(
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
    );
    anim.start();
    return () => anim.stop();
  }, [scaleAnim]);

  return (
    <ScreenWrapper title={titulo || 'Leitor de PDF'} scrollable={false}>
      {carregando && (
        <View style={styles.loaderOverlay}>
          <Animated.Text style={[styles.icone, { transform: [{ scale: scaleAnim }] }]}>📖</Animated.Text>
          <Text style={styles.loaderText}>Abrindo seu livro...</Text>
        </View>
      )}

      {finalUrl ? (
        Platform.OS === 'web' ? (
          <iframe
            src={finalUrl}
            style={styles.iframe}
            onLoad={() => setCarregando(false)}
            title={titulo || 'PDF'}
            frameBorder="0"
          />
        ) : (
          <WebView
            source={{ uri: finalUrl }}
            style={[styles.pdf, { opacity: carregando ? 0 : 1 }]}
            onLoadEnd={() => setCarregando(false)}
          />
        )
      ) : null}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  icone: {
    fontSize: 60,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 18,
    color: '#555',
  },
  pdf: {
    flex: 1,
    width: '100%',
  },
  iframe: {
    flex: 1,
    width: '100%',
    height: '100%',
    border: 'none',
  },
});
