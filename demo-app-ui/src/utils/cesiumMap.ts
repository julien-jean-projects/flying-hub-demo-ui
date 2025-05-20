import * as Cesium from "cesium";
import type { ICreateCone } from "../types/CesiumMap";

export function getCameraDirectionVector(yawDeg: number, pitchDeg: number): Cesium.Cartesian3 {
  const yaw = Cesium.Math.toRadians(yawDeg);
  const pitch = Cesium.Math.toRadians(pitchDeg);
  const x = Math.cos(pitch) * Math.sin(yaw);
  const y = Math.cos(pitch) * Math.cos(yaw);
  const z = Math.sin(pitch);
  return new Cesium.Cartesian3(x, y, z);
}

export const addCameraVisionCone: ICreateCone = (
  viewer,
  { lon, lat, alt, pitch, yaw, fov, zoom, range, color, opacity }
) => {
  // Default value to 100 if not provided
  const length = typeof range === "number" && range > 0 ? range : 100;
  const base = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
  const direction = getCameraDirectionVector(yaw ?? 0, pitch ?? 0);

  // Make zoom optional, default to 1 if not provided or invalid
  const zoomValue = typeof zoom === "number" && zoom > 0 ? zoom : 1;
  const fovEffectif = fov / zoomValue;
  const coneRadius = length * Math.tan((fovEffectif * Math.PI) / 360);

  // Cone center = base + direction * (length/2)
  const center = Cesium.Cartesian3.add(
    base,
    Cesium.Cartesian3.multiplyByScalar(direction, length / 2, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  );

  // Compute a rotation matrix that aligns the Z axis with the direction
  const z = Cesium.Cartesian3.normalize(direction, new Cesium.Cartesian3());
  const up = Math.abs(z.x) < 0.99 ? Cesium.Cartesian3.UNIT_X : Cesium.Cartesian3.UNIT_Y;
  const x = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.cross(up, z, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  );
  const y = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.cross(z, x, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  );
  const rot = new Cesium.Matrix3();
  Cesium.Matrix3.setColumn(rot, 0, x, rot);
  Cesium.Matrix3.setColumn(rot, 1, y, rot);
  Cesium.Matrix3.setColumn(rot, 2, z, rot);
  const orientation = Cesium.Quaternion.fromRotationMatrix(rot, new Cesium.Quaternion());

  // Return the created entity for external control
  return viewer.entities.add({
    position: center,
    orientation: orientation,
    cylinder: {
      length: length,
      topRadius: coneRadius,
      bottomRadius: 0,
      material: Cesium.Color.fromCssColorString(color ?? "YELLOW").withAlpha(opacity ?? 0.2),
    },
  });
};
