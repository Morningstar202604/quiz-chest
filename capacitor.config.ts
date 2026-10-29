import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tiyu.questionbank',
  appName: '题屿',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#f4f0e7',
  },
}

export default config
