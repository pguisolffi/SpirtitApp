// LottieWrapper.js
import { Platform } from 'react-native';
import LottieView from 'lottie-react-native';
import React from 'react';

const LottieWrapper = ({ animation, ...props }) => {
  if (Platform.OS === 'web') {
    const LottieWeb = require('lottie-react').default;
    return <LottieWeb animationData={animation} {...props} />;
  }

  return <LottieView source={animation} {...props} />;
};

export default LottieWrapper;
