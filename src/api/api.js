

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";



// Firebase sozlamasi - credentials bilan
const firebaseConfig = {
  apiKey: "AIzaSyBy4RAT15tXlWuWhlGSHUoBjNI7bXLdvLU",
  projectId: "doctors-appointment-2ff3f",
  messagingSenderId: "132095757038",
  appId: "1:132095757038:web:906c4a29d1ebcd9d9b81ff",
};

const VAPID_KEY = "BCYjCdsb3yKk6UvwJoNbPYs3eAnG0ImGBnmzLixg7Q1ljxjrX2Q08ksvjTyUhPLbA-Ro0TyPwPEouvrvNjOlgZw";

// Firebase initialize qilish
const app = initializeApp(firebaseConfig);

// Messaging objekti - bu doktor notifikatsiyalari uchun kerak
export const messaging = getMessaging(app);

// Doktor notifikatsiyalarini qabul qilish (app ochiqligi vaqtida)
onMessage(messaging, (payload) => {
  console.log("Doktor notifikatsiyasi:", payload);
  if (payload.notification) {
    alert(`${payload.notification.title}: ${payload.notification.body}`);
  }
});


export const getFCMToken = () => {
  return localStorage.getItem("fcm_token") || "";
};

// Ruxsat so'rash va token olish
export const requestPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });
      
      if (token) {
        console.log("FCM Token olingan:", token);
        localStorage.setItem("fcm_token", token);
        return token;
      }
    } else {
      console.log("Notifikatsiya ruxsati berilmadi");
      return null;
    }
  } catch (error) {
    console.error("Xatolik:", error);
    return null;
  }
};




const API =
  "https://7534.sangilov.uz";

export const getDoctors =
  async () => {

    try {

      console.log("🔄 Doctorlarni yuklash...");

      const res = await fetch(
        `${API}/doctor/get_doctors`
      );

      console.log("Response status:", res.status);

      if (!res.ok) {
        throw new Error(
          `Xatolik: ${res.status} - ${res.statusText}`
        );
      }

      const data = await res.json();

      console.log("✅ Doctorlar olingan:", data);

      // Backend {message: [...]} formatida qaytarmoqda
      const doctors = data.message || data;

      console.log("Array format:", doctors);
      console.log("Array mi?", Array.isArray(doctors));

      return doctors;

    } catch (err) {

      console.error("❌ Xatolik:", err);
      console.error("Error message:", err.message);

      return [];

    }
  };

export const getAppointments = async (doctorId) => {
  try {
    if (!doctorId) return [];

    const res = await fetch(
      `${API}/doctor/get_appointments/${doctorId}`,
      {
        method: "GET",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Xatolik");
    }

    return data.message || data;

  } catch (err) {
    console.error("getAppointments error:", err);
    return [];
  }
};


export const closeAppointment =
  async (appointmentId) => {

    try {

      const res = await fetch(
        `${API}/doctor/close_appointment`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            appointment_id:
              appointmentId,
          }),
        }
      );

      return await res.json();

    } catch (err) {

      console.log(err);

    }

  };
export const createAppointment = async (doctorId, name, phone) => {
  try {
    const requestData = {
      name:name,
      phone:Number(phone),
      doctor_id: Number(doctorId),
      fcm_token: getFCMToken(),
    };

    const res = await fetch(
      `${API}/user/create_appointment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Xatolik");
    }

    return data.message || data;

  } catch (err) {
    console.error("createAppointment error:", err);
    return null;
  }
};

export const cancelAppointment =
  async (appointmentId) => {

    try {

      const res = await fetch(
        `${API}/doctor/cancel_appointment`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            appointment_id:
              appointmentId,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Bekor qilishda xatolik");
      }

      const data = await res.json();

      return data;

    } catch (err) {

      console.error("❌ cancelAppointment xatolik:", err);

      return null;

    }

  };

