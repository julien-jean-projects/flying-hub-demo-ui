import { defineStore } from "pinia";
import { ref } from "vue";
import { initMQTT, disconnectMQTT, subscribe, unsubscribe } from "../services/mqttService";
import type { Drone } from "../types/Drone";
import type { Telemetry } from "../types/Telemetry";

const apiUrl = import.meta.env.VITE_API_URL;

type Topics = "drones/added" | "drones/removed" | "drones/updated" | "drone/telemetry" | "drone/video";

const eventCallbacks = Object.fromEntries(
  (Object.keys({} as Record<Topics, unknown>) as Topics[]).map((t) => [t, [] as Function[]])
) as Record<Topics, Function[]>;

export const useMQTTStore = defineStore("mqtt", () => {
  const drones = ref<Drone[]>([]);

  function getEventCallback(event: Topics, callback: Function) {
    if (!eventCallbacks[event]) {
      eventCallbacks[event] = [];
    }
    eventCallbacks[event].push(callback);
  }

  async function fetchDrones() {
    try {
      const res = await fetch(`${apiUrl}/api/drones`);
      const data = await res.json();
      drones.value = (data as Drone[]).map((d) => ({
        ...d,
        lon: d.lon as number,
        lat: d.lat as number,
      }));
    } catch (e) {
      alert("Erreur lors du chargement des drones");
    }
  }

  async function subscribeMQTT() {
    await initMQTT();

    subscribe("drones/added", (drone: Drone) => {
      if (!drones.value.some((d) => d.id === drone.id)) {
        drones.value.push(drone);
        if (eventCallbacks["drones/added"]) eventCallbacks["drones/added"].forEach((cb) => cb(drone));
      }
    });

    subscribe("drones/removed", (id: string) => {
      const idx = drones.value.findIndex((d) => d.id === id);
      if (idx !== -1) {
        drones.value.splice(idx, 1);
        if (eventCallbacks["drones/removed"]) eventCallbacks["drones/removed"].forEach((cb) => cb(id));
      }
    });

    subscribe("drones/updated", (drone: Drone) => {
      const idx = drones.value.findIndex((d) => d.id === drone.id);
      if (idx !== -1) {
        drones.value[idx] = { ...drones.value[idx], ...drone };
        if (eventCallbacks["drones/updated"]) eventCallbacks["drones/updated"].forEach((cb) => cb(drone));
      }
    });

    subscribe("drone/telemetry", (telemetry: Telemetry) => {
      if (eventCallbacks["drone/telemetry"]) eventCallbacks["drone/telemetry"].forEach((cb) => cb(telemetry));
    });

    subscribe("drone/video", (video: { url: string }) => {
      if (eventCallbacks["drone/video"]) eventCallbacks["drone/video"].forEach((cb) => cb(video));
    });
  }

  function unsubscribeMQTT() {
    disconnectMQTT();

    unsubscribe("drones/added");
    unsubscribe("drones/removed");
    unsubscribe("drones/updated");
    unsubscribe("drone/telemetry");
    unsubscribe("drone/video");
  }

  return { drones, subscribeMQTT, unsubscribeMQTT, fetchDrones, getEventCallback };
});
