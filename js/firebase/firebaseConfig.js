// Your Firebase configuration - replace with your actual Firebase project details
// You'll get these values when you create a web app in the Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyBzfi-UXM0syuvAtfUoePYOL_wy9KGuWfo",
  authDomain: "cabriolet-f4be8.firebaseapp.com",
  databaseURL: "https://cabriolet-f4be8-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cabriolet-f4be8",
  storageBucket: "cabriolet-f4be8.firebasestorage.app",
  messagingSenderId: "875618818364",
  appId: "1:875618818364:web:96873a7ad71bc709066639",
  measurementId: "G-GC1BV6YD3F"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database(); 