import mqtt from "mqtt";

const brokerUrl = import.meta.env.VITE_MQTT_URL;

let client: mqtt.MqttClient | null = null;

export function initMQTT(): Promise<mqtt.MqttClient> {
  return new Promise((resolve, reject) => {
    if (client) return resolve(client);

    client = mqtt.connect(brokerUrl);

    client.on("connect", () => {
      console.log("[MQTT] Connected to broker");
      resolve(client!);
    });

    client.on("error", (err) => {
      console.error("[MQTT] Connection error:", err);
      reject(err);
    });
  });
}

export function disconnectMQTT() {
  if (client) {
    client.end(true, () => {
      console.log("[MQTT] Disconnected from broker");
      client = null;
    });
  }
}

export function subscribe(topic: string, callback: (payload: any) => void) {
  if (!client) {
    throw new Error("MQTT not initialized. Call initMQTT() first.");
  }

  client.subscribe(topic, (err) => {
    if (err) {
      console.error(`[MQTT] Failed to subscribe to ${topic}`, err);
    } else {
      console.log(`[MQTT] Subscribed to ${topic}`);
    }
  });

  const handler = (receivedTopic: string, message: Buffer) => {
    if (receivedTopic === topic) {
      try {
        const data = JSON.parse(message.toString());
        callback(data);
      } catch (e) {
        console.error("[MQTT] Failed to parse message", e);
      }
    }
  };

  client.on("message", handler);

  return () => {
    client?.off("message", handler);
    client?.unsubscribe(topic);
  };
}

export function unsubscribe(topic: string) {
  if (!client) return;

  client.unsubscribe(topic, (err) => {
    if (err) {
      console.error(`[MQTT] Failed to unsubscribe from ${topic}`, err);
    } else {
      console.log(`[MQTT] Unsubscribed from ${topic}`);
    }
  });
}
