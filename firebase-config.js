// Firebase configuration and initialization
const firebaseConfig = {
    apiKey: "AIzaSyDIMziMEygrNUc3VeYxLOyj98JSMyeEkI8",
    authDomain: "cadastro-39a2b.firebaseapp.com", 
    databaseURL: "https://cadastro-39a2b-default-rtdb.firebaseio.com",
    projectId: "cadastro-39a2b",
    storageBucket: "cadastro-39a2b.firebasestorage.app",
    messagingSenderId: "457985275329",
    appId: "1:457985275329:web:3f830cce90394d93e76b40",
    measurementId: "G-M9EJJJZL5V"
};

// Export config for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}

// Make available globally
window.firebaseConfig = firebaseConfig;