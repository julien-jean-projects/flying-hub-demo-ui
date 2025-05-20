export interface DroneGimbal {
  yaw: number;
  pitch: number;
  fov: number;
  zoom?: number;
}

export interface Drone {
  id: string;
  lon?: number;
  lat?: number;
  alt: number;
  gimbal: DroneGimbal;
}
