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
  { id: "c4ca4238a0b923820dcc509a6f75849b", lon: 2.36, lat: 48.86, alt: 20, gimbal: { yaw: 120, pitch: -10 } },
  { id: "c81e728d9d4c2f636f067f89cc14862c", lon: 2.365, lat: 48.862, alt: 50, gimbal: { yaw: 135, pitch: -20 } },
  { id: "eccbc87e4b5ce2fe28308fd9f2a7baf3", lon: 2.37, lat: 48.861, alt: 80, gimbal: { yaw: 150, pitch: -15 } },
  { id: "a87ff679a2f3e71d9181a67b7542122c", lon: 2.375, lat: 48.859, alt: 280, gimbal: { yaw: 160, pitch: -25 } },
  { id: "e4da3b7fbbce2345d7772b0674a318d5", lon: 2.38, lat: 48.857, alt: 60, gimbal: { yaw: 140, pitch: -10 } },
  { id: "1679091c5a880faf6fb5e6087eb1b2dc", lon: 2.385, lat: 48.855, alt: 40, gimbal: { yaw: 130, pitch: -5 } },
  { id: "8f14e45fceea167a5a36dedd4bea2543", lon: 2.39, lat: 48.853, alt: 70, gimbal: { yaw: 125, pitch: -8 } },
  { id: "c9f0f895fb98ab9159f51fd0297e236d", lon: 2.395, lat: 48.851, alt: 30, gimbal: { yaw: 115, pitch: -12 } },
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
