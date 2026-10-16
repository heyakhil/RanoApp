import React from 'react';
import Svg, { Path } from 'react-native-svg';

export interface GoogleLogoProps {
  size?: number;
}

export const GoogleLogo: React.FC<GoogleLogoProps> = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z"
      fill="#4285F4"
    />
    <Path
      d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.759-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z"
      fill="#34A853"
    />
    <Path
      d="M4.405 11.9A6.01 6.01 0 014.09 10c0-.662.114-1.305.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.341-2.59z"
      fill="#FBBC05"
    />
    <Path
      d="M10 3.977c1.468 0 2.786.505 3.822 1.496l2.868-2.868C14.959.99 12.695 0 10 0A9.996 9.996 0 001.064 5.51l3.341 2.59C5.19 5.736 7.395 3.977 10 3.977z"
      fill="#EA4335"
    />
  </Svg>
);
