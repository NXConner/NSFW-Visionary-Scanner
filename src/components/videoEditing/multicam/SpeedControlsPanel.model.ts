export interface SpeedControlState {
  speed: number; // 0.25 to 8
  enableSpeedRamp: boolean;
  rampStartSpeed: number;
  rampEndSpeed: number;
  rampDuration: number; // seconds
  reversePlayback: boolean;
  frameBlending: boolean;
}

export const defaultSpeedControl: SpeedControlState = {
  speed: 1,
  enableSpeedRamp: false,
  rampStartSpeed: 1,
  rampEndSpeed: 0.25,
  rampDuration: 2,
  reversePlayback: false,
  frameBlending: true,
};
