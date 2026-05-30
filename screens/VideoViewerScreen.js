import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';
import ScreenWrapper from '../components/ScreenWrapper';

export default function VideoViewerScreen() {
  const { videoId } = useLocalSearchParams();
  const videoUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <ScreenWrapper title="Visualizar Vídeo">
      <View style={styles.playerContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            src={videoUrl}
            style={styles.iframe}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title="YouTube Video"
          />
        ) : (
          <WebView
            source={{ uri: videoUrl }}
            style={styles.webview}
            allowsFullscreenVideo
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
    maxWidth: 800,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  webview: {
    flex: 1,
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
});
