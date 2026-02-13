export interface AudioState {
  volume: number;
  muted: boolean;
  fadeInDuration: number;
  fadeOutDuration: number;
  enableBackgroundMusic: boolean;
  backgroundMusicVolume: number;
  enableVoiceOver: boolean;
  voiceOverVolume: number;
  ducking: boolean;
  duckingAmount: number;
  normalize: boolean;
  denoiseLevel: number;
}

export const defaultAudioState: AudioState = {
  volume: 100,
  muted: false,
  fadeInDuration: 0,
  fadeOutDuration: 0,
  enableBackgroundMusic: false,
  backgroundMusicVolume: 50,
  enableVoiceOver: false,
  voiceOverVolume: 100,
  ducking: true,
  duckingAmount: 70,
  normalize: false,
  denoiseLevel: 0,
};
