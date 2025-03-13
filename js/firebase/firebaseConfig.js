// Your Firebase configuration - replace with your actual Firebase project details
// You'll get these values when you create a web app in the Firebase console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "cabriolet-f4be8.firebaseapp.com",
  databaseURL: "https://cabriolet-f4be8-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "cabriolet-f4be8",
  storageBucket: "cabriolet-f4be8.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database(); 