<script setup lang="ts">
import { onMounted, ref } from "vue";
import * as Cesium from "cesium";
import type {
  IWaypoint,
  IAddWaypoint,
  IUpdateDronePoseAndCamera,
  ILookAtWaypoint,
  ISelectWaypointEntity,
  IFocusOnWaypointById,
  IComponentCesiumMapExpose,
  IGetViewerEntityById,
} from "../types/CesiumMap";

import droneImage from "../assets/drone.png";

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

// type Props = { hide?: boolean };
// const props = withDefaults(defineProps<Props>(), {
//   hide: false,
// });

// Refs et variables globales
const cesiumContainerRef = ref<HTMLDivElement | null>(null);
const viewer = ref<Cesium.Viewer | null>(null);
const droneEntity = ref<Cesium.Entity | null>(null);
const cameraRayEntity = ref<Cesium.Entity | null>(null);
const allPositions = ref<Cesium.Cartesian3[]>([]);
const isUserLockedOnWaypoint = ref(false);

// Initialisation Cesium
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
      droneEntity.value = viewer.value.entities.add({
        name: "Drone",
        label: {
          text: ``,
          font: "14pt sans-serif",
          fillColor: Cesium.Color.YELLOWGREEN,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -50),
        },
        show: false,
        billboard: {
          image: droneImage,
          scale: 1,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          eyeOffset: new Cesium.Cartesian3(0, 0, -10),
        },
      });

      viewer.value.entities.add({
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
        if (Cesium.defined(picked) && picked.id) selectWaypointEntity(picked.id);
        else if (viewer.value) viewer.value.selectedEntity = undefined;
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      viewer.value.selectedEntityChanged.addEventListener((selectedEntity: Cesium.Entity | undefined) => {
        if (!selectedEntity && isUserLockedOnWaypoint.value && viewer.value) {
          isUserLockedOnWaypoint.value = false;
          viewer.value.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
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
});

// Fonctions
function getCameraDirectionVector(yawDeg: number, pitchDeg: number): Cesium.Cartesian3 {
  const yaw = Cesium.Math.toRadians(yawDeg);
  const pitch = Cesium.Math.toRadians(pitchDeg);
  const x = Math.cos(pitch) * Math.sin(yaw);
  const y = Math.cos(pitch) * Math.cos(yaw);
  const z = Math.sin(pitch);
  return new Cesium.Cartesian3(x, y, z);
}

const updateDronePoseAndCamera: IUpdateDronePoseAndCamera = ({ id, lon, lat, alt, gimbal }) => {
  const position = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
  if (droneEntity.value) {
    droneEntity.value.position = new Cesium.ConstantPositionProperty(position);
    droneEntity.value.show = true;
    if (droneEntity.value?.label) {
      droneEntity.value.label.text = new Cesium.ConstantProperty(`DroneName (alt: ${alt}m)`);
    }
  }

  if (gimbal) {
    const direction = getCameraDirectionVector(gimbal.yaw, gimbal.pitch);
    const end = Cesium.Cartesian3.add(
      position,
      Cesium.Cartesian3.multiplyByScalar(direction, 50, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );

    if (!cameraRayEntity.value && viewer.value) {
      cameraRayEntity.value = viewer.value.entities.add({
        name: "Camera Direction",
        polyline: {
          positions: [position, end],
          width: 48,
          material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.ORANGE),
        },
      });
    } else if (cameraRayEntity.value) {
      cameraRayEntity.value.polyline!.positions = new Cesium.ConstantProperty([position, end]);
    }
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
        polyline: {
          positions: [position, end],
          width: 48,
          material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.YELLOW),
        },
      });
    }

    if (centerCamera && !isUserLockedOnWaypoint.value) {
      lookAtWaypoint(lon, lat, alt, { distance: 500, heightOffset: 10, pitch: -25, temporary: true });
    }
  }
};

const selectWaypointEntity: ISelectWaypointEntity = (entity) => {
  if (!entity || !entity.position || !viewer.value) return;
  const carto = Cesium.Cartographic.fromCartesian(
    entity.position.getValue(Cesium.JulianDate.now()) as Cesium.Cartesian3
  );
  const lon = Cesium.Math.toDegrees(carto.longitude);
  const lat = Cesium.Math.toDegrees(carto.latitude);
  const alt = carto.height;

  isUserLockedOnWaypoint.value = true;
  lookAtWaypoint(lon, lat, alt, { distance: 500, heightOffset: 20, pitch: -30 });
  viewer.value.selectedEntity = entity;
};

const focusOnWaypointById: IFocusOnWaypointById = (id) => {
  if (!viewer.value) return;
  const entity = viewer.value.entities.getById(id);
  if (!entity || !entity.position) {
    console.warn("❌ Waypoint introuvable ou sans position :", id);
    return;
  }
  selectWaypointEntity(entity);
};

const getViewerEntityById: IGetViewerEntityById = (id: string) => {
  if (!viewer.value) return null;
  const entity = viewer.value.entities.getById(id);

  return entity ? entity : null;
};

defineExpose<IComponentCesiumMapExpose>({
  getViewerEntityById,
  updateDronePoseAndCamera,
  lookAtWaypoint,
  addWaypoint,
  selectWaypointEntity,
  focusOnWaypointById,
});
</script>

<template>
  <div ref="cesiumContainerRef" class="w-full h-screen"></div>
</template>
