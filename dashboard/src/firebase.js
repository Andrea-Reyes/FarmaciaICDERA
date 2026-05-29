import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDrLzOHLgi9am3yVSxlAlYYraatVCWYk2o",
    authDomain: "proyectofinal-52338.firebaseapp.com",
    databaseURL: "https://proyectofinal-52338-default-rtdb.firebaseio.com",
    projectId: "proyectofinal-52338",
    storageBucket: "proyectofinal-52338.firebasestorage.app",
    messagingSenderId: "556798394522",
    appId: "1:556798394522:web:02f0ce44141efc7a6d9f23",
    measurementId: "G-4W5QS1877R"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };