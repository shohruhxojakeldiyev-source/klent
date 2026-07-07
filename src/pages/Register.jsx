import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sendCode, register, createAppointment } from "../api/api";

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL dan doctor_id olish va saqlash
  useEffect(() => {
    const doctorId = searchParams.get("doctor_id");
    if (doctorId) {
      localStorage.setItem("doctor_id", doctorId);
    }
  }, []);

  const [step, setStep] = useState(1); // 1: ma'lumot kiritish, 2: kodni tasdiqlash
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1-qadam: SMS kod yuborish
  const handleSendCode = async () => {
    setError("");
    if (!name.trim()) return setError("Ism familiyangizni kiriting");
    if (!phone.trim() || phone.length !== 9) return setError("9 ta raqam kiriting");
    if (!password || password.length < 6) return setError("Parol kamida 6 ta belgi bo'lishi kerak");

    setLoading(true);
    try {
      const res = await sendCode(phone);
      if (res) {
        setStep(2);
      } else {
        setError("SMS yuborishda xatolik");
      }
    } catch (err) {
      setError("Xatolik yuz berdi");
    }
    setLoading(false);
  };

  // 2-qadam: ro'yxatdan o'tish va navbat olish
  const handleRegister = async () => {
    setError("");
    if (!code.trim()) return setError("Kodni kiriting");

    setLoading(true);
    try {
      const doctorId = localStorage.getItem("doctor_id");

      // Register
      const res = await register(name.trim(), phone, password, code);
      if (!res || !res.access_token) {
        setError("Ro'yxatdan o'tishda xatolik");
        setLoading(false);
        return;
      }

      // Tokenni saqlash
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("user_name", res.name || name.trim());

      // Navbat olish
      const appt = await createAppointment(doctorId, res.access_token);
      if (appt) {
        localStorage.setItem("myAppointment", JSON.stringify({
          id: appt.appointment_id || appt.id || appt.queue,
          doctor_id: doctorId,
          patient_name: name.trim(),
          phone: phone,
          queue: appt.queue,
        }));
        navigate("/client");
      } else {
        setError("Navbat olishda xatolik");
      }
    } catch (err) {
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

      {step === 1 && (
        <>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Ism familiya</label>
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
                style={{ ...inputStyle, paddingLeft: "58px", lineHeight: "normal" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Parol</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kamida 6 ta belgi"
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>

          <button
            onClick={handleSendCode}
            disabled={loading}
            style={btnStyle}
          >
            {loading ? "Yuklanmoqda..." : "Kod olish"}
          </button>

          <p style={{ textAlign: "center", marginTop: "16px", color: "#64748b" }}>
            Hisobingiz bormi?{" "}
            <span
              onClick={() => navigate("/login")}
              style={{ color: "#16a34a", cursor: "pointer", fontWeight: "600" }}
            >
              Kirish
            </span>
          </p>
        </>
      )}

      {step === 2 && (
        <>
          <p style={{ color: "#64748b", marginBottom: "16px", textAlign: "center" }}>
            +998{phone} raqamiga SMS kod yuborildi
          </p>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Tasdiqlash kodi</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SMS kodini kiriting"
              inputMode="numeric"
              style={{ ...inputStyle, textAlign: "center", fontSize: "20px", letterSpacing: "4px" }}
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            style={btnStyle}
          >
            {loading ? "Yuklanmoqda..." : "Tasdiqlash va navbat olish"}
          </button>

          <p
            onClick={() => setStep(1)}
            style={{ textAlign: "center", marginTop: "16px", color: "#64748b", cursor: "pointer" }}
          >
            ← Ortga
          </p>
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
  WebkitBoxShadow: "0 0 0 1000px #fff inset",
  WebkitTextFillColor: "#0f172a",
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