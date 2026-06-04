//Importacion de librerias
require("dotenv").config();
const mqtt = require("mqtt");
const admin = require("firebase-admin");

//Declaracion de variables de entorno (HiveMQ)
const MQTT_BROKER = process.env.MQTT_BROKER;
const MQTT_TOPIC = process.env.MQTT_TOPIC;
const MQTT_USER = process.env.MQTT_USER;
const MQTT_PASS = process.env.MQTT_PASS;

//Declaracion de peso y coleccion
const pesoProducto = 260;
const DEFAULT_COLLECTION = "jugosKerns";

//Implementacion de credenciales de firebase
/*const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
*/
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});
const db = admin.firestore();

//Funcion para calcular cantidad de productos existentes
function calcularStock({ peso }) {
  const stock = Math.round(peso / pesoProducto);
  return { stock };
}

//Conexion usando mqtt
const client = mqtt.connect(MQTT_BROKER, {
  username: MQTT_USER,
  password: MQTT_PASS,
  reconnectPeriod: 3000,
  clientId: `proyecto-icdera-${Date.now()}`,
});

//Muestra logs cuando se logra una conexion
client.on("connect", () => {
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error("Error: ", err.message);
    } else {
      console.log(`Conexion con topic: ${MQTT_TOPIC}`);
    }
  });
});

//Muestra logs cuando hay un registro nuevo
client.on("message", async (topic, rawMessage) => {
  //console.log(rawMessage.toString());

  //Validacion de json
  let payload;
  try {
    payload = JSON.parse(rawMessage.toString());
  } catch (e) {
    console.warn("Error: ", rawMessage.toString());
    return;
  }

  //Validacion de peso
  const { producto, peso, timestamp } = payload;
  if (typeof peso !== "number") {
    console.warn("Error: ", payload);
    return;
  }

  //Calculo de stock
  const { stock } = calcularStock({ peso });

  //Creacion de coleccion
  const collection = "jugosKerns";
  //const collection = producto ? producto.toLowerCase().replace(/\s/g, "") : DEFAULT_COLLECTION;

  //Envio de datos
  const doc = {
    producto: producto || "jugosKerns",
    peso,
    stock,
    timestamp: timestamp
      ? admin.firestore.Timestamp.fromDate(new Date(timestamp))
      : admin.firestore.FieldValue.serverTimestamp(),
    //recibidoEn: admin.firestore.FieldValue.serverTimestamp(),
  };

  //Almacenamiento de datos en firebase
  try {
    const ref = await db.collection(collection).add(doc);
    console.log(`Coleccion: ${collection} | ID: ${ref.id} | Producto: ${producto} | Peso: ${peso}g | Stock: ${stock} | Timestamp: ${timestamp}`);
  } catch (err) {
    console.error("Error: ", err.message);
  }
});

//Validacion de errores
client.on("error", (err) => {
  console.error("Error:b", err.message);
});