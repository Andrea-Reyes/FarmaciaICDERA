/* npm install mqtt firebase-admin dotenv */

require("dotenv").config();
const mqtt = require("mqtt");
const admin = require("firebase-admin");

const MQTT_BROKER = process.env.MQTT_BROKER || "";
const MQTT_TOPIC = process.env.MQTT_TOPIC || "";
const MQTT_USER = process.env.MQTT_USER || "";
const MQTT_PASS = process.env.MQTT_PASS || "";

const pesoPastilla = 10;
const DEFAULT_COLLECTION = "diclofenaco";
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

function calcularStock({ nombre, peso }) {
  const stock = Math.round(peso / pesoPastilla);
  return { stock };
}

const client = mqtt.connect(MQTT_BROKER, {
  username: MQTT_USER,
  password: MQTT_PASS,
  reconnectPeriod: 3000,
  clientId: `farmiot-bridge-${Date.now()}`,
});

client.on("connect", () => {
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error("Error", err.message);
    } else {
      console.log(`Conexion con topic: ${MQTT_TOPIC}`);
    }
  });
});

client.on("message", async (topic, rawMessage) => {
  let payload;

  try {
    payload = JSON.parse(rawMessage.toString());
  } catch (e) {
    console.warn("Error:", rawMessage.toString());
    return;
  }

  const { nombre, peso, timestamp } = payload;

  if (typeof peso !== "number") {
    console.warn("No hay peso: ", payload);
    return;
  }

  const { stock } = calcularStock({ nombre, peso });

  const collection = nombre
    ? nombre.toLowerCase().replace(/\s/g, "")
    : DEFAULT_COLLECTION;

  const doc = {
    nombre: nombre || "diclofenaco",
    peso,
    stock,
    timestamp: timestamp
      ? admin.firestore.Timestamp.fromMillis(timestamp * 1000)
      : admin.firestore.FieldValue.serverTimestamp(),
    recibidoEn: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    const ref = await db.collection(collection).add(doc);
    console.log(
      `${collection} | ID: ${ref.id} | peso: ${peso}g - stock estimado: ${stock} pastillas`
    );
  } catch (err) {
    console.error("Error:", err.message);
  }
});

client.on("error", (err) => {
  console.error("Error: ", err.message);
});