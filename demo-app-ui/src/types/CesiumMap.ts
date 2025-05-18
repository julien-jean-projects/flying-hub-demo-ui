import * as Cesium from "cesium";

export interface IWaypoint {
  id: string;
  lon: number;
  lat: number;
  alt: number;
  gimbal: {
    yaw: number;
    pitch: number;
    fov: number;
    zoom?: number;
  };
}

export interface IComponentCesiumMapExpose {
  getViewerEntityById: IGetViewerEntityById;
  addWaypoint: IAddWaypoint;
  updateDronePoseAndCamera: IUpdateDronePoseAndCamera;
  lookAtWaypoint: ILookAtWaypoint;
  selectWaypointEntity: ISelectWaypointEntity;
  focusOnWaypointById: IFocusOnWaypointById;
  removeWaypointAndCone: IRemoveWaypointAndCone;
  addDrone: (drone: {
    id: string;
    lon: number;
    lat: number;
    alt: number;
    gimbal?: { yaw: number; pitch: number; fov: number; zoom?: number };
  }) => void;
  removeDrone: (droneId: string) => void;
}

export interface IAddWaypoint {
  (waypoint: IWaypoint, centerCamera?: boolean): void;
}

export interface ICreateCone {
  (
    viewer: Cesium.Viewer,
    params: {
      lon: number;
      lat: number;
      alt: number;
      pitch: number;
      yaw: number;

      fov: number; // example: FOV of DJI Mavic Pro is 68
      zoom?: number; // zoom level
      range?: number; // camera distance

      color?: string;
      opacity?: number;
    }
  ): Cesium.Entity;
}

export interface IUpdateDronePoseAndCamera {
  (waypoint: IWaypoint): void;
}

export interface ILookAtWaypoint {
  (
    lon: number,
    lat: number,
    alt: number,
    options?: {
      distance?: number;
      heightOffset?: number;
      pitch?: number;
      temporary?: boolean;
      focusDuration?: number;
    }
  ): void;
}

export interface IGetViewerEntityById {
  (id: string): Cesium.Entity | null;
}

export interface ISelectWaypointEntity {
  (entity: Cesium.Entity): void;
}

export interface IFocusOnWaypointById {
  (id: string): void;
}

export interface IRemoveWaypointAndCone {
  (id: string): void;
}
