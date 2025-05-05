import * as Cesium from "cesium";

export interface IWaypoint {
  id: string;
  lon: number;
  lat: number;
  alt: number;
  gimbal: {
    yaw: number;
    pitch: number;
  };
}

export interface IComponentCesiumMapExpose {
  getViewerEntityById: IGetViewerEntityById;
  addWaypoint: IAddWaypoint;
  updateDronePoseAndCamera: IUpdateDronePoseAndCamera;
  lookAtWaypoint: ILookAtWaypoint;
  selectWaypointEntity: ISelectWaypointEntity;
  focusOnWaypointById: IFocusOnWaypointById;
}

export interface IAddWaypoint {
  (waypoint: IWaypoint, centerCamera?: boolean): void;
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
