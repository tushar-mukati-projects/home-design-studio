export type CameraPresetId = "corner" | "top" | "front" | "walkthrough";

export type CameraPreset = {
  position: [number, number, number];
  target: [number, number, number];
};

export const CAMERA_PRESETS: Record<CameraPresetId, (size: number) => CameraPreset> = {
  corner: (size) => ({
    position: [size * 0.9, size * 0.8, size * 0.9],
    target: [0, 0, 0],
  }),
  top: (size) => ({
    position: [0, size * 2, 0.01],
    target: [0, 0, 0],
  }),
  front: (size) => ({
    position: [0, size * 0.4, size * 1.5],
    target: [0, size * 0.3, 0],
  }),
  walkthrough: (size) => ({
    position: [0, 1.6, size * 0.3],
    target: [0, 1.6, -size * 0.3],
  }),
};
