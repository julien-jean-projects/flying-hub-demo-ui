<script setup lang="ts">
import { onMounted, ref, defineProps, defineEmits } from "vue";
import * as Cesium from "cesium";
import { addCameraVisionCone, getCameraDirectionVector } from "../utils/cesiumMap";
import type {
  IWaypoint,
  IAddWaypoint,
  IUpdateDronePoseAndCamera,
  ILookAtWaypoint,
  ISelectCesiumEntity,
  IFocusOnCesiumEntityById,
  IComponentCesiumMapExpose,
  IGetViewerEntityById,
  IRemoveWaypointAndCone,
  IExclusionZone,
} from "../types/CesiumMap";

import droneImage from "../assets/drone.png";

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

const emit = defineEmits(["map-click", "gimbal-orient"]);
const props = defineProps<{ droneCreation?: boolean }>();

// Refs et variables globales
const cesiumContainerRef = ref<HTMLDivElement | null>(null);
const viewer = ref<Cesium.Viewer | null>(null);
const allPositions = ref<Cesium.Cartesian3[]>([]);
const isUserLockedOnWaypoint = ref(false);

// Map to store cone entities associated with waypoints
const waypointConeEntities = new Map<string, Cesium.Entity>();

// Map to store drone entities by id
const droneEntities = new Map<string, Cesium.Entity>();

// --- Exclusion zones (red polygons) ---
const exclusionZones = ref<IExclusionZone[]>([]);
const exclusionZoneEntities = new Map<string, Cesium.Entity>();

// Cesium initialization
onMounted(() => {
  if (cesiumContainerRef.value) {
    viewer.value = new Cesium.Viewer(cesiumContainerRef.value as Element, {
      baseLayerPicker: true,
      sceneModePicker: true,
      geocoder: true,
      animation: false,
      timeline: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      homeButton: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      sceneMode: Cesium.SceneMode.COLUMBUS_VIEW,
    });

    if (viewer.value) {
      viewer.value.entities.add({
        description: "___UNSELECTABLE___",
        polyline: {
          positions: new Cesium.CallbackProperty(() => allPositions.value, false),
          width: 4,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.RED,
            dashLength: 8.0,
          }),
        },
      });

      const handler = new Cesium.ScreenSpaceEventHandler(viewer.value.scene.canvas);
      handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const picked = viewer.value?.scene.pick(movement.position);
        if (Cesium.defined(picked) && picked.id) {
          selectCesiumEntity(picked.id, { focus: true });
        } else if (viewer.value) {
          deselectCesiumEntity();
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // If an entity has a ___UNSELECTABLE___ description, clear the selection
      viewer.value?.selectedEntityChanged.addEventListener((e) => {
        if (!e) {
          isUserLockedOnWaypoint.value = false;
          viewer.value?.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        }
        if (e && (e.description?.getValue?.() ?? e.description) === "___UNSELECTABLE___") {
          deselectCesiumEntity();
        }
      });

      if (viewer.value) {
        viewer.value.scene.morphComplete.addEventListener(() => {
          if (allPositions.value.length > 0 && viewer.value) {
            const last = allPositions.value[allPositions.value.length - 1];
            viewer.value.camera.flyTo({
              destination: Cesium.Cartesian3.add(last, new Cesium.Cartesian3(0, 0, 500), new Cesium.Cartesian3()),
              duration: 1.5,
            });
          }
        });
      }
    }
  }

  if (viewer.value) {
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.value.scene.canvas);
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      console.log("[CesiumMap] LEFT_CLICK handler called", props.droneCreation);
      if (props.droneCreation) {
        const cartesian = viewer.value!.scene.pickPosition(movement.position);
        if (cartesian) {
          const carto = Cesium.Cartographic.fromCartesian(cartesian);
          const lon = Cesium.Math.toDegrees(carto.longitude);
          const lat = Cesium.Math.toDegrees(carto.latitude);
          console.log("[CesiumMap] map-click", { lon, lat });
          emit("map-click", { lon, lat });
        } else {
          console.log("[CesiumMap] Impossible de récupérer la position du clic");
        }
        return;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  if (viewer.value && viewer.value.infoBox) {
    viewer.value.infoBox.viewModel.closeClicked.addEventListener(() => {
      deselectCesiumEntity();
    });
  }
});

// Functions

function removeDrone(droneId: string) {
  if (!viewer.value) return;
  // Remove the drone entity
  const entity = droneEntities.get(droneId);
  if (entity) {
    viewer.value.entities.remove(entity);
    droneEntities.delete(droneId);
  }
  // Remove the arrow and cone
  const vision = droneVisionEntities.get(droneId);
  if (vision) {
    viewer.value.entities.remove(vision.arrow);
    viewer.value.entities.remove(vision.cone);
    droneVisionEntities.delete(droneId);
  }
}

const updateDronePoseAndCamera: IUpdateDronePoseAndCamera = ({ id, lon, lat, alt, gimbal }) => {
  // Met à jour la position et la vision du drone existant (ne crée pas de drone)
  if (!droneEntities.has(id)) return;
  const entity = droneEntities.get(id)!;
  entity.position = new Cesium.ConstantPositionProperty(Cesium.Cartesian3.fromDegrees(lon, lat, alt));
  entity.show = true;
  if (entity.label) {
    entity.label.text = new Cesium.ConstantProperty(`Drone ${id} (alt: ${alt}m)`);
  }
  if (gimbal) {
    updateDroneVision(id, { lon, lat, alt, gimbal });
  }
};

const lookAtWaypoint: ILookAtWaypoint = (lon, lat, alt, options = {}) => {
  const { distance = 100, heightOffset = 20, pitch = -30, temporary = false, focusDuration = 0 } = options;

  const heading = Cesium.Math.toRadians(0);
  const pitchRad = Cesium.Math.toRadians(pitch);
  const range = distance;
  const target = Cesium.Cartesian3.fromDegrees(lon, lat, alt + heightOffset);

  if (viewer.value) {
    viewer.value.camera.lookAt(target, new Cesium.HeadingPitchRange(heading, pitchRad, range));
  }

  if (temporary) {
    setTimeout(() => {
      if (!isUserLockedOnWaypoint.value && viewer.value) {
        viewer.value.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
      }
    }, focusDuration);
  }
};

const addWaypoint: IAddWaypoint = ({ id, lon, lat, alt, gimbal }: IWaypoint, centerCamera = false) => {
  if (viewer.value?.entities.getById(id)) {
    console.warn(`❌ Une entité avec l'id ${id} existe déjà. Ajout ignoré.`);
    return;
  }

  const position = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
  allPositions.value.push(position);

  if (viewer.value) {
    viewer.value.entities.add({
      id,
      name: `Waypoint ${id}`,
      position,
      point: { pixelSize: 10, color: Cesium.Color.LIGHTSLATEGRAY },
      label: {
        text: `ID ${id} (alt: ${alt}m)`,
        font: "14pt sans-serif",
        fillColor: Cesium.Color.WHITE,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -15),
      },
      polyline: {
        positions: [Cesium.Cartesian3.fromDegrees(lon, lat, 0), position],
        width: 4,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.RED,
          dashLength: 4.0,
        }),
      },
    });

    if (gimbal) {
      const direction = getCameraDirectionVector(gimbal.yaw, gimbal.pitch);
      const end = Cesium.Cartesian3.add(
        position,
        Cesium.Cartesian3.multiplyByScalar(direction, 50, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
      );
      viewer.value.entities.add({
        name: `Caméra prévue ${id}`,
        description: "___UNSELECTABLE___",
        polyline: {
          positions: [position, end],
          width: 48,
          material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.YELLOW),
        },
      });

      const coneEntity = addCameraVisionCone(viewer.value, {
        lon,
        lat,
        alt,
        pitch: gimbal.pitch,
        yaw: gimbal.yaw,
        color: "green",
        opacity: 0.2,
        fov: gimbal.fov,
        zoom: gimbal.zoom,
      });
      if (coneEntity) {
        coneEntity.description = new Cesium.ConstantProperty("___UNSELECTABLE___");
        waypointConeEntities.set(id, coneEntity);
      }
    }

    if (centerCamera && !isUserLockedOnWaypoint.value) {
      lookAtWaypoint(lon, lat, alt, { distance: 500, heightOffset: 10, pitch: -25, temporary: true });
    }
  }
};

const removeWaypointAndCone: IRemoveWaypointAndCone = (id: string) => {
  if (!viewer.value) return;

  const entity = viewer.value.entities.getById(id);
  if (entity) viewer.value.entities.remove(entity);

  const coneEntity = waypointConeEntities.get(id);
  if (coneEntity) {
    viewer.value.entities.remove(coneEntity);
    waypointConeEntities.delete(id);
  }
};

const selectCesiumEntity: ISelectCesiumEntity = (entity, options = {}) => {
  if ((entity.description?.getValue?.() ?? entity.description) === "___UNSELECTABLE___") {
    isUserLockedOnWaypoint.value = false;
    return null;
  }

  if (!entity || !entity.position || !viewer.value) return null;
  const carto = Cesium.Cartographic.fromCartesian(
    entity.position.getValue(Cesium.JulianDate.now()) as Cesium.Cartesian3
  );
  const lon = Cesium.Math.toDegrees(carto.longitude);
  const lat = Cesium.Math.toDegrees(carto.latitude);
  const alt = carto.height;

  isUserLockedOnWaypoint.value = true;
  options.focus && lookAtWaypoint(lon, lat, alt, { distance: 500, heightOffset: 20, pitch: -30 });

  viewer.value.selectedEntity = entity;

  return { lon, lat, alt };
};

const focusOnCesiumEntityById: IFocusOnCesiumEntityById = (id) => {
  if (!viewer.value) return;
  const entity = viewer.value.entities.getById(id);
  if (!entity || !entity.position) {
    console.warn("❌ Waypoint introuvable ou sans position :", id);
    return;
  }
  const coords = selectCesiumEntity(entity);

  coords && lookAtWaypoint(coords.lon, coords.lat, coords.alt, { distance: 500, heightOffset: 20, pitch: -30 });
};

const isCesiumEntitySelected = () => !!(viewer.value && viewer.value.selectedEntity);

const deselectCesiumEntity = () => {
  if (viewer.value) {
    viewer.value.selectedEntity = undefined;
  }
};

const getViewerEntityById: IGetViewerEntityById = (id: string) => {
  if (!viewer.value) return null;
  const entity = viewer.value.entities.getById(id);

  return entity ? entity : null;
};

// Add a drone to the map (updated to handle arrow and cone)
function addDrone(drone: {
  id: string;
  lon: number;
  lat: number;
  alt: number;
  gimbal?: { yaw: number; pitch: number; fov: number; zoom?: number };
}) {
  if (!viewer.value) return;
  if (droneEntities.has(drone.id)) {
    // Update the position if the drone already exists
    const entity = droneEntities.get(drone.id)!;
    entity.position = new Cesium.ConstantPositionProperty(
      Cesium.Cartesian3.fromDegrees(drone.lon, drone.lat, drone.alt)
    );
    entity.show = true;
    if (entity.label) {
      entity.label.text = new Cesium.ConstantProperty(`Drone ${drone.id} (alt: ${drone.alt}m)`);
    }
    // Update the arrow and cone if gimbal is provided
    if (drone.gimbal) {
      updateDroneVision(drone.id, drone);
    }
    return;
  }
  // Create a new drone entity
  const entity = viewer.value.entities.add({
    id: drone.id,
    name: `Drone ${drone.id}`,
    position: Cesium.Cartesian3.fromDegrees(drone.lon, drone.lat, drone.alt),
    label: {
      text: `Drone ${drone.id} (alt: ${drone.alt}m)`,
      font: "14pt sans-serif",
      fillColor: Cesium.Color.YELLOWGREEN,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -50),
    },
    billboard: {
      image: droneImage,
      scale: 1,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      eyeOffset: new Cesium.Cartesian3(0, 0, -10),
    },
  });
  droneEntities.set(drone.id, entity);
  // Add the orange arrow and vision cone if gimbal is provided
  if (drone.gimbal) {
    updateDroneVision(drone.id, drone);
  }
}

// Arrow and vision cone management for each drone
const droneVisionEntities = new Map<string, { arrow: Cesium.Entity; cone: Cesium.Entity }>();

function updateDroneVision(
  droneId: string,
  drone: { lon: number; lat: number; alt: number; gimbal?: { yaw: number; pitch: number; fov: number; zoom?: number } }
) {
  if (!viewer.value || !drone.gimbal) return;
  // Direction calculation
  const position = Cesium.Cartesian3.fromDegrees(drone.lon, drone.lat, drone.alt);
  const direction = getCameraDirectionVector(drone.gimbal.yaw, drone.gimbal.pitch);
  const end = Cesium.Cartesian3.add(
    position,
    Cesium.Cartesian3.multiplyByScalar(direction, 50, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  );
  // Orange arrow
  let arrowEntity: Cesium.Entity;
  let coneEntity: Cesium.Entity;
  if (droneVisionEntities.has(droneId)) {
    // Mise à jour des entités existantes
    arrowEntity = droneVisionEntities.get(droneId)!.arrow;
    arrowEntity.polyline!.positions = new Cesium.ConstantProperty([position, end]);
    coneEntity = droneVisionEntities.get(droneId)!.cone;
    viewer.value.entities.remove(coneEntity);
    coneEntity = addCameraVisionCone(viewer.value, {
      lon: drone.lon,
      lat: drone.lat,
      alt: drone.alt,
      pitch: drone.gimbal.pitch,
      yaw: drone.gimbal.yaw,
      color: "yellow",
      opacity: 0.2,
      fov: drone.gimbal.fov,
      zoom: drone.gimbal.zoom,
    });
  } else {
    // Création initiale
    arrowEntity = viewer.value.entities.add({
      name: `Camera Direction ${droneId}`,
      description: "___UNSELECTABLE___",
      polyline: {
        positions: [position, end],
        width: 48,
        material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.ORANGE),
      },
    });
    coneEntity = addCameraVisionCone(viewer.value, {
      lon: drone.lon,
      lat: drone.lat,
      alt: drone.alt,
      pitch: drone.gimbal.pitch,
      yaw: drone.gimbal.yaw,
      color: "yellow",
      opacity: 0.2,
      fov: drone.gimbal.fov,
      zoom: drone.gimbal.zoom,
    });
    if (coneEntity) coneEntity.description = new Cesium.ConstantProperty("___UNSELECTABLE___");
  }
  droneVisionEntities.set(droneId, { arrow: arrowEntity, cone: coneEntity });
}

// --- Exclusion zone management ---
function addExclusionZone(zone: IExclusionZone) {
  if (!viewer.value) return;

  removeExclusionZone(zone.id);
  const positions = zone.points.map((p) => Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 0));
  const entity = viewer.value.entities.add({
    id: `exclusion-${zone.id}`,
    polygon: {
      hierarchy: positions,
      material: Cesium.Color.RED.withAlpha(0.4),
      outline: true,
      outlineColor: Cesium.Color.RED,
      outlineWidth: 2,
    },
    description: "___UNSELECTABLE___",
  });
  exclusionZones.value.push(zone);
  exclusionZoneEntities.set(zone.id, entity);
}

function removeExclusionZone(id: string) {
  if (!viewer.value) return;
  const entity = exclusionZoneEntities.get(id);
  if (entity) {
    viewer.value.entities.remove(entity);
    exclusionZoneEntities.delete(id);
  }
  exclusionZones.value = exclusionZones.value.filter((z) => z.id !== id);
}

function getExclusionZones() {
  return exclusionZones.value;
}

function clearAllWaypointsAndPolylines() {
  if (!viewer.value) return;
  // Remove all waypoints (points, polylines, arrows, cones)
  const entities = viewer.value.entities.values;
  const toRemove = [];
  for (const entity of entities) {
    // Target entities created for waypoints (points, polylines, arrows, cones)
    if (
      (entity.name && entity.name.startsWith("Waypoint ")) ||
      (entity.name && entity.name.startsWith("Caméra prévue ")) ||
      (entity.name && entity.name.startsWith("Camera Direction ")) ||
      (entity.polyline &&
        entity.polyline.material &&
        ((entity.polyline.material instanceof Cesium.ColorMaterialProperty &&
          entity.polyline.material.color?.getValue &&
          Cesium.Color.equals(entity.polyline.material.color.getValue(Cesium.JulianDate.now()), Cesium.Color.RED)) ||
          entity.polyline.material instanceof Cesium.PolylineDashMaterialProperty))
    ) {
      // DO NOT REMOVE the main red polyline (description '___UNSELECTABLE___')
      let desc =
        typeof entity.description?.getValue === "function"
          ? entity.description.getValue(Cesium.JulianDate.now())
          : entity.description;
      if (desc === "___UNSELECTABLE___") {
        continue;
      }
      toRemove.push(entity);
    }
  }
  toRemove.forEach((e) => viewer.value!.entities.remove(e));
  allPositions.value = [];
  // Cleanup green cones and yellow arrows related to waypoints
  waypointConeEntities.forEach((coneEntity) => {
    viewer.value!.entities.remove(coneEntity);
  });
  waypointConeEntities.clear();
  // Remove yellow arrows ("Caméra prévue") if they exist
  const yellowArrowsToRemove: Cesium.Entity[] = [];
  for (const entity of viewer.value!.entities.values) {
    if (entity.name && entity.name.startsWith("Caméra prévue ")) {
      yellowArrowsToRemove.push(entity);
    }
  }
  yellowArrowsToRemove.forEach((e) => viewer.value!.entities.remove(e));
}

function setAllPositions(positions: Cesium.Cartesian3[]) {
  allPositions.value = positions;
}

function removeCameraArrowByWaypointId(id: string) {
  if (!viewer.value) return;
  const toRemove: Cesium.Entity[] = [];
  for (const entity of viewer.value.entities.values) {
    if (entity.name === `Caméra prévue ${id}`) {
      toRemove.push(entity);
    }
  }
  toRemove.forEach((e) => viewer.value!.entities.remove(e));
}

defineExpose<IComponentCesiumMapExpose>({
  getViewerEntityById,
  updateDronePoseAndCamera,
  lookAtWaypoint,
  addWaypoint,
  selectCesiumEntity,
  focusOnCesiumEntityById,
  isCesiumEntitySelected,
  deselectCesiumEntity,
  removeWaypointAndCone,
  addDrone,
  removeDrone,
  addExclusionZone,
  removeExclusionZone,
  getExclusionZones,
  clearAllWaypointsAndPolylines,
  setAllPositions,
  removeCameraArrowByWaypointId,
});
</script>

<template>
  <div ref="cesiumContainerRef" class="w-full h-screen"></div>
</template>
