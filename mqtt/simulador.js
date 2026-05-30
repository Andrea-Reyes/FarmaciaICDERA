require("dotenv").config();
const mqtt = require("mqtt");

const BROKER = process.env.MQTT_BROKER;
const TOPIC = process.env.MQTT_TOPIC || "farmacia/datos";
const USER = process.env.MQTT_USER;
const PASS = process.env.MQTT_PASS;

let pesoActual = 600;
let pesoPastilla = 10;

const client = mqtt.connect(BROKER, {
  username: USER,
  password: PASS,
  clientId: `simulador-${Date.now()}`,
});

client.on("connect", () => {
  setInterval(() => {
    const pesoMenos = Math.floor(Math.random() * 15) + 5;
    pesoActual = Math.max(0, pesoActual - pesoMenos);

    const payload = JSON.stringify({
      nombre: "diclofenaco",
      peso: pesoActual,
      timestamp: Math.floor(Date.now() / 1000),
    });

    client.publish(TOPIC, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error("Error:", err.message);
      } else {
        const stock = Math.round(pesoActual / pesoPastilla);
        console.log(`peso: ${pesoActual}g | stock: ${stock} pastillas`);
      }
    });

    if (pesoActual === 0) {
      pesoActual = 600;
    }
  }, 3000);
});

client.on("error", (err) => {
  console.error("Error:", err.message);
});