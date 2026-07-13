import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, getAppointments, createAppointment } from "../api/api";

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!phone.trim() || phone.length !== 9) return setError("9 ta raqam kiriting");
    if (!password) return setError("Parolni kiriting");

    setLoading(true);
    try {
      const res = await login(phone, password);
      if (!res || !res.access_token) {
        setError("Telefon yoki parol noto'g'ri");
        setLoading(false);
        return;
      }

      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("user_name", res.name || "");

      const doctorId = localStorage.getItem("doctor_id");
      let myAppt = null;

      if (doctorId) {
        const appts = await getAppointments(doctorId);
        const list = Array.isArray(appts) ? appts : [];
        myAppt = list.find(
          (a) =>
            String(a.phone) === String(phone) ||
            String(a.user_id) === String(res.user_id)
        );
      }

      if (myAppt) {
        // Mavjud navbat topildi
        localStorage.setItem("myAppointment", JSON.stringify({
          id: myAppt.id || myAppt.appointment_id,
          doctor_id: doctorId,
          patient_name: myAppt.patient_name || myAppt.name || res.name,
          phone: myAppt.phone,
          queue: myAppt.queue,
        }));
      } else {
        // Navbat yo'q — avtomatik yangi navbat olish
        const appt = await createAppointment(doctorId, res.access_token, res.name || "", phone);
        if (appt) {
          localStorage.setItem("myAppointment", JSON.stringify({
            id: appt.appointment_id || appt.id,
            doctor_id: doctorId,
            patient_name: res.name || "",
            phone: phone,
            queue: appt.queue,
          }));
        }
      }

      navigate("/client");
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
        Kirish
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
          placeholder="Parolingiz"
          autoComplete="current-password"
          style={inputStyle}
        />
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        style={btnStyle}
      >
        {loading ? "Yuklanmoqda..." : "Kirish"}
      </button>

      <p style={{ textAlign: "center", marginTop: "16px", color: "#64748b" }}>
        Hisobingiz yo'qmi?{" "}
        <span
          onClick={() => navigate("/register")}
          style={{ color: "#16a34a", cursor: "pointer", fontWeight: "600" }}
        >
          Ro'yxatdan o'tish
        </span>
      </p>
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

export default Login;
