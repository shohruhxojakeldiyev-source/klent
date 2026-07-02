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
  console.log("Doktor notifikatsiyasi:", payload);
});


export const getFCMToken = () => {
  return localStorage.getItem("fcm_token") || "";
};

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
  return null;
};

const API = "https://doctorapi.sangilov.uz";

export const getDoctors = async () => {
  try {
    console.log("🔄 Doctorlarni yuklash...");

    const res = await fetch(`${API}/doctor/get_doctors`);

    console.log("Response status:", res.status);

    if (!res.ok) {
      throw new Error(`Xatolik: ${res.status} - ${res.statusText}`);
    }

    const data = await res.json();

    console.log("✅ Doctorlar olingan:", data);

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

    const res = await fetch(`${API}/doctor/get_appointments/${doctorId}`, {
      method: "GET",
    });

    if (res.status === 404) {
      return [];
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Xatolik");
    }

    return data.appointments || data.message || data;
  } catch (err) {
    console.error("getAppointments error:", err);
    return [];
  }
};

export const closeAppointment = async (appointmentId) => {
  try {
    const res = await fetch(`${API}/doctor/close_appointment`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appointment_id: appointmentId,
      }),
    });

    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

export const createAppointment = async (doctorId, name, phone) => {
  try {
    
    let fcmToken = getFCMToken();
   if (!fcmToken) {
  try {
    fcmToken = (await requestPermission()) || "";
  } catch(e) {
    fcmToken = "";
  }
}

    const requestData = {
      name: name,
      phone: phone,
      doctor_id: Number(doctorId),
      fcm_token: fcmToken || "",
    };

    const res = await fetch(`${API}/user/create_appointment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Xatolik");
    }

    return data;
  } catch (err) {
    console.error("createAppointment error:", err);
    return null;
  }
};

export const cancelAppointment = async (appointmentId) => {
  try {
    const res = await fetch(`${API}/doctor/close_appointment`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appointment_id: appointmentId,
      }),
    });

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

export const skipAppointment = async (appointmentId, countSkip) => {
  try {
    const res = await fetch(`${API}/user/skip_appointment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appointment_id: appointmentId,
        count_skip: countSkip,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Surushda xatolik");
    }

    return data;
  } catch (err) {
    console.error("❌ skipAppointment xatolik:", err);
    return null;
  }
};