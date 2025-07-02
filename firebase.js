// firebase.js
// Este arquivo é um módulo, por isso precisa das importações

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove, update } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// Sua configuração do app web do Firebase (copie do console Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyAJUFyTFe4U105r0LvBn-6byxMC5An56nw",
  authDomain: "gestaohorarioseconomia-e08c2.firebaseapp.com",
  projectId: "gestaohorarioseconomia-e08c2",
  storageBucket: "gestaohorarioseconomia-e08c2.firebasestorage.app",
  messagingSenderId: "1004280428475",
  appId: "1:1004280428475:web:061265018bbc7c3eb5369e",
  databaseURL: "https://gestaohorarioseconomia-e08c2-default-rtdb.firebaseio.com" // MUITO IMPORTANTE: Verifique se este é o URL correto do seu Realtime Database!
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Obtém uma referência para o Realtime Database
const database = getDatabase(app);

// Para o timestamp do servidor no Realtime Database, usa-se este objeto literal especial
const ServerValueTimestamp = { ".sv": "timestamp" };

// Torna as funções e a instância do database acessíveis globalmente
// para que o script.js possa utilizá-los sem precisar importá-los novamente.
// Isso simplifica a interconexão entre este módulo e o script.js
window.firebaseDB = database;
window.dbRef = ref;
window.dbPush = push;
window.dbSet = set;
window.dbOnValue = onValue;
window.dbRemove = remove;     // Expondo para futuras operações de exclusão (se precisar)
window.dbUpdate = update;     // Expondo para futuras operações de atualização (se precisar)
window.dbServerTimestamp = ServerValueTimestamp;

console.log("Firebase Database inicializado e funções exportadas para 'window'.");
