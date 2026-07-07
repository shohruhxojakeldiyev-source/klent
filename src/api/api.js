export const createAppointment = async (doctorId, token) => {
  try {
    let fcmToken = getFCMToken();
    if (!fcmToken) {
      try { fcmToken = (await requestPermission()) || ""; } catch { fcmToken = ""; }
    }

    const today = new Date().toISOString().split("T")[0];

    console.log('📤 createAppointment so\'rovi:', {
      doctor_id: Number(doctorId),
      appointment_date: today,
      fcm_token: fcmToken || "",
    });

    const res = await fetch(`${API}/user/create_appointment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        doctor_id: Number(doctorId),
        appointment_date: today,
        fcm_token: fcmToken || "",
      }),
    });

    const data = await res.json();
    console.log('📥 createAppointment javobi:', data);

    if (!res.ok) throw new Error(data.detail || "Navbat olishda xatolik");
    return data;
  } catch (err) {
    console.error("createAppointment xatolik:", err);
    return null;
  }
};