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

export interface IMission {
  id: string;
  waypoints: IWaypoint[];
  description: string;
  authorId: number;
}

export interface IExclusionZone {
  id: string;
  color?: string;
  points: Array<{ lon: number; lat: number }>;
}

export interface IComponentCesiumMapExpose {
  getViewerEntityById: IGetViewerEntityById;
  addWaypoint: IAddWaypoint;
  updateDronePoseAndCamera: IUpdateDronePoseAndCamera;
  lookAtWaypoint: ILookAtWaypoint;
  selectCesiumEntity: ISelectCesiumEntity;
  focusOnCesiumEntityById: IFocusOnCesiumEntityById;
  removeWaypointAndCone: IRemoveWaypointAndCone;
  addDrone: (drone: {
    id: string;
    lon: number;
    lat: number;
    alt: number;
    gimbal?: { yaw: number; pitch: number; fov: number; zoom?: number };
  }) => void;
  removeDrone: (droneId: string) => void;
  /** Returns true if a Cesium entity is selected, false otherwise */
  isCesiumEntitySelected: () => boolean;
  /** Deselects any selected Cesium entity */
  deselectCesiumEntity: () => void;
  /** Adds an exclusion zone (red polygon) */
  addExclusionZone: (zone: IExclusionZone) => void;
  /** Removes an exclusion zone by id */
  removeExclusionZone: (id: string) => void;
  /** Returns the list of exclusion zones */
  getExclusionZones: () => IExclusionZone[];
  /** Clears all waypoints, polylines, and arrows from the map */
  clearAllWaypointsAndPolylines: () => void;
  /** Updates the trajectory (red polyline) of the waypoints */
  setAllPositions: (positions: Cesium.Cartesian3[]) => void;
  /** Removes the yellow arrow associated with a given waypoint */
  removeCameraArrowByWaypointId: (id: string) => void;
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

export interface ISelectCesiumEntity {
  (entity: Cesium.Entity, options?: { focus?: boolean }): null | { lon: number; lat: number; alt: number };
}

export interface IFocusOnCesiumEntityById {
  (id: string): void;
}

export interface IRemoveWaypointAndCone {
  (id: string): void;
}
