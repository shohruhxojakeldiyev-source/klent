importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBy4RAT15tXlWuWhlGSHUoBjNI7bXLdvLU",
  projectId: "doctors-appointment-2ff3f",
  messagingSenderId: "132095757038",
  appId: "1:132095757038:web:906c4a29d1ebcd9d9b81ff",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, { body });
});