const mqtt = require("mqtt");
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:51242";
const client = mqtt.connect(brokerUrl);

client.on("connect", () => {
  console.log("MQTT connected to", brokerUrl);
});

app.use(express.static(path.join(__dirname, "public")));

const waypoints = [
  { id: "c509a6f75849b", lon: 2.36, lat: 48.86, alt: 20, gimbal: { yaw: 0, pitch: -10, fov: 68 } },
  { id: "67f89cc14862c", lon: 2.365, lat: 48.862, alt: 50, gimbal: { yaw: 45, pitch: -20, fov: 68 } },
  { id: "08fd9f2a7baf3", lon: 2.37, lat: 48.861, alt: 80, gimbal: { yaw: 315, pitch: -12, fov: 68 } },
  { id: "1a67b7542122c", lon: 2.375, lat: 48.859, alt: 280, gimbal: { yaw: 135, pitch: -25, fov: 68 } },
  { id: "72b0674a318d5", lon: 2.38, lat: 48.857, alt: 60, gimbal: { yaw: 180, pitch: -10, fov: 68 } },
  { id: "5e6087eb1b2dc", lon: 2.385, lat: 48.855, alt: 40, gimbal: { yaw: 225, pitch: -5, fov: 68, zoom: 5 } },
  { id: "6dedd4bea2543", lon: 2.39, lat: 48.853, alt: 70, gimbal: { yaw: 270, pitch: -8, fov: 68, zoom: 5 } },
  { id: "51fd0297e236d", lon: 2.395, lat: 48.851, alt: 30, gimbal: { yaw: 315, pitch: -12, fov: 68 } },
];

const drones = [
  { id: "drone-1", lon: 2.359, lat: 48.86, alt: 120, gimbal: { yaw: 30, pitch: -45, fov: 68, zoom: 5 } },
  { id: "drone-2", lon: 2.3585, lat: 48.86, alt: 120, gimbal: { yaw: 30, pitch: -45, fov: 68, zoom: 5 } },
];

const missions = [
  { id: "mission-1", waypoints, description: "Inspection Tour Eiffel", authorId: 1 },
  { id: "mission-2", waypoints, description: "Surveillance Seine", authorId: 1 },
  { id: "mission-3", waypoints, description: "Patrouille Quartier Latin", authorId: 2 },
];

app.use(express.json());

app.get("/api/drones", (req, res) => {
  res.json(drones);
});

app.post("/api/drones", (req, res) => {
  const drone = req.body;
  if (!drone || !drone.id) return res.status(400).json({ error: "id manquant" });
  if (drones.find((d) => d.id === drone.id)) return res.status(409).json({ error: "déjà existant" });
  drones.push(drone);
  client.publish("drones/added", JSON.stringify(drone));
  res.json({ ok: true });
});

app.delete("/api/drones/:id", (req, res) => {
  const { id } = req.params;
  const idx = drones.findIndex((d) => d.id === id);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  drones.splice(idx, 1);
  client.publish("drones/removed", id);
  res.json({ ok: true });
});

app.put("/api/drones/:id", (req, res) => {
  const { id } = req.params;
  const idx = drones.findIndex((d) => d.id === id);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  const update = req.body;
  drones[idx] = { ...drones[idx], ...update, id };
  client.publish("drones/updated", JSON.stringify(drones[idx]));
  res.json({ ok: true, drone: drones[idx] });
});

// testing ... adds and removes every 5 seconds to test MQTT
setInterval(() => {
  const idx = drones.findIndex((d) => d.id === "drone-3");
  if (idx === -1) {
    // add
    const drone3 = {
      id: "drone-3",
      lon: 2.358,
      lat: 48.86,
      alt: 120,
      gimbal: { yaw: 30, pitch: -90, fov: 68, zoom: 5 },
    };
    drones.push(drone3);
    client.publish("drones/added", JSON.stringify(drone3));
    console.log("[API] Drone-3 ajouté et publié via MQTT");
  } else {
    // remove
    const drone3 = drones[idx];
    drones.splice(idx, 1);
    client.publish("drones/removed", JSON.stringify(drone3));
    console.log("[API] Drone-3 supprimé et publié via MQTT");
  }
}, 5000);

let telemetryTimer = null;

app.get("/camera-play", (req, res) => {
  if (telemetryTimer) clearInterval(telemetryTimer);

  const source = `/video.mp4`;
  const interval = 4000;
  let battery = 95;
  let index = 0;

  function publishTelemetry() {
    const wp = waypoints[index];
    if (!wp) {
      clearInterval(telemetryTimer);
      telemetryTimer = null;
      return;
    }
    const signal = Math.floor(Math.random() * 4) + 2;
    const telemetry = {
      gps: { lat: wp.lat, lon: wp.lon },
      altitude: wp.alt,
      gimbal: wp.gimbal,
      battery,
      signal,
      id: "drone-1",
    };
    client.publish("drone/telemetry", JSON.stringify(telemetry));
    if (index % 2 === 1) battery = Math.max(battery - 1, 0);
    index++;
  }

  publishTelemetry();
  telemetryTimer = setInterval(publishTelemetry, interval);

  client.publish("drone/video", JSON.stringify({ url: source }));

  res.send(`Video ${source} sent with ${waypoints.length} points for drone-1 over 32s`);
});

app.get("/api/waypoints", (req, res) => {
  res.json(missions);
});

app.get("/api/waypoints/:id", (req, res) => {
  const mission = missions.find((m) => m.id === req.params.id);
  if (!mission) return res.status(404).json({ error: "Mission not found" });
  res.json(mission.waypoints);
});

const port = parseInt(process.env.DRONE_SERVER_HTTP_PORT || 3000);
app.listen(port, () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
