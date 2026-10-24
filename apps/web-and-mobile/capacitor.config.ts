import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.m37.b2b',
  appName: 'M37',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
  },
};

export default config;
