export interface Telemetry {
  id?: string;
  battery?: number;
  signal?: number;
  gps?: { lat: number; lon: number };
  altitude?: number;
  gimbal?: { yaw: number; pitch: number; fov: number };
}
