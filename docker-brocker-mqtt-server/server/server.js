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
  { id: "c509a6f75849b", lon: 2.36, lat: 48.86, alt: 20, gimbal: { yaw: 120, pitch: -10, fov: 68 } },
  { id: "67f89cc14862c", lon: 2.365, lat: 48.862, alt: 50, gimbal: { yaw: 135, pitch: -20, fov: 72 } },
  { id: "08fd9f2a7baf3", lon: 2.37, lat: 48.861, alt: 80, gimbal: { yaw: 150, pitch: -15, fov: 65 } },
  { id: "1a67b7542122c", lon: 2.375, lat: 48.859, alt: 280, gimbal: { yaw: 160, pitch: -25, fov: 75 } },
  { id: "72b0674a318d5", lon: 2.38, lat: 48.857, alt: 60, gimbal: { yaw: 140, pitch: -10, fov: 69 } },
  { id: "5e6087eb1b2dc", lon: 2.385, lat: 48.855, alt: 40, gimbal: { yaw: 130, pitch: -5, fov: 71 } },
  { id: "6dedd4bea2543", lon: 2.39, lat: 48.853, alt: 70, gimbal: { yaw: 125, pitch: -8, fov: 67 } },
  { id: "51fd0297e236d", lon: 2.395, lat: 48.851, alt: 30, gimbal: { yaw: 115, pitch: -12, fov: 73 } },
];

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
    };

    client.publish("drone/telemetry", JSON.stringify(telemetry));
    if (index % 2 === 1) battery = Math.max(battery - 1, 0);
    index++;
  }

  publishTelemetry();
  telemetryTimer = setInterval(publishTelemetry, interval);

  client.publish("drone/video", JSON.stringify({ url: source }));

  res.send(`Video ${source} sent with ${waypoints.length} points over 32s`);
});

app.get("/waypoints", (req, res) => {
  res.json(waypoints);
});

const port = parseInt(process.env.DRONE_SERVER_HTTP_PORT || 3000);
app.listen(port, () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
