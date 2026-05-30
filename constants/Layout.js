import { Dimensions, Platform } from 'react-native';

const { width: winWidth, height: winHeight } = Dimensions.get('window');

// Standard mobile device maximum dimensions for web layouts
export const MAX_WEB_WIDTH = 450;
export const MAX_WEB_HEIGHT = 800;

export const width = Platform.OS === 'web' ? Math.min(winWidth, MAX_WEB_WIDTH) : winWidth;
export const height = Platform.OS === 'web' ? Math.min(winHeight, MAX_WEB_HEIGHT) : winHeight;
export const isWeb = Platform.OS === 'web';
