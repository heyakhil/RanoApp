export const colors = {
  primary: '#2563EB',
  secondary: '#16A34A',
  background: '#F5F7FB',
  surface: '#FFFFFF',
  text: '#17233B',
  textSecondary: '#758198',
  border: '#E8ECF3',
  error: '#E05252',
  white: '#FFFFFF',
  black: '#000000',
  navy: '#101D36',
  navyLight: '#1C2D4D',
  blueSoft: '#EAF1FF',
  greenSoft: '#E8F7EF',
  amber: '#B77916',
  amberSoft: '#FFF4DD',
  muted: '#EFF2F7',
  warning: '#F2A900',
} as const;

export type ColorKey = keyof typeof colors;
