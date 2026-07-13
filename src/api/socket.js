// src/socket.js
// WebSocket ulanishini boshqaruvchi alohida fayl.
// Bu fayl faqat ULANISH ochadi va xabar kelganda chaqiruvchiga qaytaradi.
// Ro'yxatni yangilash, modal ko'rsatish kabi ishlar Client.jsx da bo'ladi.

const WS_BASE = "wss://doctorsappointment-production-d0b9.up.railway.app/ws/appointment";

/**
 * Appointment uchun WebSocket ochadi.
 *
 * @param {string|number} appointmentId - mening navbat raqamim
 * @param {function} onMessage - server xabar yuborganda chaqiriladi (event.data uzatiladi)
 * @returns {function} cleanup - ulanishni yopish uchun chaqiriladigan funksiya
 */
export const connectAppointmentSocket = (appointmentId, onMessage) => {
  if (!appointmentId) return () => {};

  const ws = new WebSocket(`${WS_BASE}/${appointmentId}`);

  ws.onopen = () => {
    console.log("WS ulandi:", appointmentId);
  };

  ws.onmessage = (event) => {
    console.log("📨 WS xabar:", event.data);
    // xabarni chaqiruvchiga (Client.jsx) uzatamiz
    if (typeof onMessage === "function") {
      onMessage(event.data);
    }
  };

  ws.onerror = (e) => {
    console.error("WS xato:", e);
  };

  ws.onclose = () => {
    console.log("WS uzildi");
  };

  // tozalash funksiyasi — Client unmount bo'lganda yoki navbat o'zgarganda chaqiriladi
  return () => {
    ws.close();
  };
};