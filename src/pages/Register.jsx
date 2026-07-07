import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register, sendCode, createAppointment } from "../api/api";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1); // 1 - ma'lumotlar, 2 - kod tasdiqlash
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1-qadam: SMS kod yuborish
  const handleSendCode = async () => {
    setError("");
    if (!name.trim()) return setError("Ism familiyani kiriting");
    if (!phone.trim() || phone.length !== 9) return setError("9 ta raqam kiriting");
    if (!password || password.length < 4) return setError("Parol kamida 4 ta belgi");

    setLoading(true);
    const result = await sendCode(phone);
    setLoading(false);

    if (result) {
      setStep(2);
    } else {
      setError("SMS kod yuborishda xatolik");
    }
  };

  // 2-qadam: Ro'yxatdan o'tish va navbat olish
  const handleRegister = async () => {
    setError("");
    if (!code || code.length !== 6) return setError("6 xonalik kodni kiriting");

    setLoading(true);

    try {
      // 1. Ro'yxatdan o'tish
      const registerResult = await register(name, phone, password, code);
      console.log('📝 Ro\'yxatdan o\'tish javobi:', registerResult);

      if (!registerResult || !registerResult.access_token) {
        setError("Ro'yxatdan o'tishda xatolik");
        setLoading(false);
        return;
      }

      // 2. Tokenni saqlash
      localStorage.setItem("access_token", registerResult.access_token);
      localStorage.setItem("user_name", registerResult.name || name);

      // 3. Doctor ID ni localStorage dan olish
      const doctorId = localStorage.getItem("doctor_id");
      console.log('👨‍⚕️ Doctor ID:', doctorId);

      if (!doctorId) {
        setError("Doctor ID topilmadi. QR kodni skaner qiling!");
        setLoading(false);
        return;
      }

      // 4. Navbat olish (createAppointment)
      console.log('📋 Navbat olinmoqda...');
      const appointmentResult = await createAppointment(
        doctorId,
        registerResult.access_token
      );
      console.log('📋 Navbat olish javobi:', appointmentResult);

      if (!appointmentResult) {
        setError("Navbat olishda xatolik");
        setLoading(false);
        return;
      }

      // 5. Appointment ma'lumotlarini localStorage ga saqlash
      const appointmentData = {
        id: appointmentResult.id || appointmentResult.appointment_id,
        doctor_id: doctorId,
        patient_name: name,
        phone: phone,
        queue: appointmentResult.queue || appointmentResult.queue_number || 0,
      };
      localStorage.setItem("myAppointment", JSON.stringify(appointmentData));
      console.log('✅ Saqlangan appointment:', appointmentData);

      // 6. Client sahifasiga o'tish
      navigate("/client");

    } catch (err) {
      console.error('❌ Xatolik:', err);
      setError("Xatolik yuz berdi");
    }
    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: "400px",
      margin: "0 auto",
      background: "#fff",
      borderRadius: "16px",
      padding: "32px 24px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "24px", color: "#0f172a" }}>
        Ro'yxatdan o'tish
      </h2>

      {error && (
        <div style={{
          background: "#fee2e2", color: "#dc2626",
          padding: "12px 16px", borderRadius: "10px",
          marginBottom: "16px", fontSize: "14px"
        }}>
          {error}
        </div>
      )}

      {step === 1 ? (
        // 1-qadam: Ma'lumotlar
        <>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Ism Familiya</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ism familiyangiz"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Telefon</label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "14px", top: "50%",
                transform: "translateY(-55%)", color: "#0f172a",
                fontSize: "16px", fontWeight: "500", pointerEvents: "none"
              }}>+998 </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                placeholder=""
                inputMode="numeric"
                style={{ ...inputStyle, paddingLeft: "58px" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Parol</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parolingiz"
              style={inputStyle}
            />
          </div>

          <button
            onClick={handleSendCode}
            disabled={loading}
            style={btnStyle}
          >
            {loading ? "Yuborilmoqda..." : "Kod yuborish"}
          </button>
        </>
      ) : (
        // 2-qadam: Kod tasdiqlash
        <>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>
              Telefonga yuborilgan kod
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6 xonalik kod"
              inputMode="numeric"
              style={inputStyle}
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            style={btnStyle}
          >
            {loading ? "Ro'yxatdan o'tilmoqda..." : "Tasdiqlash va navbat olish"}
          </button>

          <button
            onClick={() => setStep(1)}
            style={{
              ...btnStyle,
              background: "#64748b",
              marginTop: "10px"
            }}
          >
            ← Ortga
          </button>
        </>
      )}
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "16px",
  outline: "none",
  boxSizing: "border-box",
  color: "#0f172a",
  background: "#fff",
};

const btnStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
};

export default Register;