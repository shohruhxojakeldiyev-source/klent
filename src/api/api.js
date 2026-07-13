import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBy4RAT15tXlWuWhlGSHUoBjNI7bXLdvLU",
  projectId: "doctors-appointment-2ff3f",
  messagingSenderId: "132095757038",
  appId: "1:132095757038:web:906c4a29d1ebcd9d9b81ff",
};

const VAPID_KEY = "BCYjCdsb3yKk6UvwJoNbPYs3eAnG0ImGBnmzLixg7Q1ljxjrX2Q08ksvjTyUhPLbA-Ro0TyPwPEouvrvNjOlgZw";

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

onMessage(messaging, (payload) => {
  console.log("Notifikatsiya:", payload);
});

const API = "https://doctorsappointment-production-d0b9.up.railway.app";

// ─── FCM Token ────────────────────────────────────────────────────────────────

export const getFCMToken = () => localStorage.getItem("fcm_token") || "";

export const requestPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return "";
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      localStorage.setItem("fcm_token", token);
      return token;
    }
    return "";
  } catch (err) {
    console.error("FCM xatolik:", err);
    return "";
  }
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

// SMS kod yuborish
export const sendCode = async (phone) => {
  try {
    const res = await fetch(`${API}/user/send_code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "SMS yuborishda xatolik");
    return data;
  } catch (err) {
    console.error("sendCode xatolik:", err);
    return null;
  }
};

// Ro'yxatdan o'tish
export const register = async (name, phone, password, code) => {
  try {
    const res = await fetch(`${API}/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, password, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Ro'yxatdan o'tishda xatolik");
    return data;
  } catch (err) {
    console.error("register xatolik:", err);
    return null;
  }
};

// Kirish
export const login = async (phone, password) => {
  try {
    const res = await fetch(`${API}/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone:phone, password:password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Kirishda xatolik");
    return data;
  } catch (err) {
    console.error("login xatolik:", err);
    return null;
  }
};

// ─── Doctor ───────────────────────────────────────────────────────────────────

export const getDoctors = async () => {
  try {
    const res = await fetch(`${API}/doctor/get_doctors`);
    if (!res.ok) throw new Error(`Xatolik: ${res.status}`);
    const data = await res.json();
    return data.message || data;
  } catch (err) {
    console.error("getDoctors xatolik:", err);
    return [];
  }
};

export const getAppointments = async (doctorId) => {
  try {
    if (!doctorId) return [];
    const token = localStorage.getItem("access_token") || "";
    const res = await fetch(`${API}/doctor/get_appointments/${doctorId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Xatolik");
    return data.appointments || data.message || data;
  } catch (err) {
    console.error("getAppointments xatolik:", err);
    return [];
  }
};

// ─── Navbat ───────────────────────────────────────────────────────────────────

export const createAppointment = async (doctorId, token, name, phone) => {
  try {
    let fcmToken = getFCMToken();
    if (!fcmToken) {
      try { fcmToken = (await requestPermission()) || ""; } catch { fcmToken = ""; }
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const res = await fetch(`${API}/user/create_appointment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: name || "",
        phone: phone || "",
        doctor_id: Number(doctorId),
        appointment_date: today,
        fcm_token: fcmToken || "",
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Navbat olishda xatolik");
    return data;
  } catch (err) {
    console.error("createAppointment xatolik:", err);
    return null;
  }
};

export const cancelAppointment = async (appointmentId) => {
  try {
    const token = localStorage.getItem("access_token") || "";
    const res = await fetch(`${API}/doctor/close_appointment`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ appointment_id: appointmentId }),
    });
    if (!res.ok) throw new Error("Bekor qilishda xatolik");
    return await res.json();
  } catch (err) {
    console.error("cancelAppointment xatolik:", err);
    return null;
  }
};

export const closeAppointment = async (appointmentId) => {
  try {
    const token = localStorage.getItem("access_token") || "";
    const res = await fetch(`${API}/doctor/close_appointment`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ appointment_id: appointmentId }),
    });
    return await res.json();
  } catch (err) {
    console.error("closeAppointment xatolik:", err);
    return null;
  }
};

export const skipAppointment = async (appointmentId, countSkip) => {
  try {
    const token = localStorage.getItem("access_token") || "";
    const res = await fetch(`${API}/user/skip_appointment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ appointment_id: appointmentId, count_skip: countSkip }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Surishda xatolik");
    return data;
  } catch (err) {
    console.error("skipAppointment xatolik:", err);
    return null;
  }
};