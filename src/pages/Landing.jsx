import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDoctors } from "../api/api";

const Landing = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [doctorName, setDoctorName] = useState("");
  const [hasDoctorId, setHasDoctorId] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("doctor_id");
    if (fromUrl) localStorage.setItem("doctor_id", fromUrl);

    const doctorId = fromUrl || localStorage.getItem("doctor_id");
    if (doctorId) {
      setHasDoctorId(true);
      getDoctors().then((doctors) => {
        if (Array.isArray(doctors)) {
          const found = doctors.find((d) => String(d.id) === String(doctorId));
          if (found) setDoctorName(found.name);
        }
      });
    }
  }, []);

  // doctor_id yo'q — QR kod so'rash
  if (!hasDoctorId) {
    return (
      <div style={{
        maxWidth: "400px",
        margin: "0 auto",
        background: "#fff",
        borderRadius: "16px",
        padding: "40px 24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>📷</div>
        <h3 style={{ margin: "0 0 12px", color: "#0f172a" }}>QR kodni skaner qiling</h3>
        <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6" }}>
          Navbat olish uchun klinikadagi QR kodni kamerangiz orqali skaner qiling.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: "400px",
      margin: "0 auto",
      background: "#fff",
      borderRadius: "16px",
      padding: "40px 24px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      textAlign: "center"
    }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏥</div>

      {doctorName && (
        <p style={{ color: "#64748b", marginBottom: "4px", fontSize: "14px" }}>Doktor</p>
      )}
      {doctorName && (
        <h2 style={{ margin: "0 0 24px", color: "#0f172a" }}>{doctorName}</h2>
      )}

      <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>Navbat olish</h3>
      <p style={{ color: "#64748b", marginBottom: "32px", fontSize: "14px" }}>
        Davom etish uchun tanlang
      </p>

      <button
        onClick={() => navigate("/register")}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "10px",
          border: "none",
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          color: "#fff",
          fontSize: "16px",
          fontWeight: "600",
          cursor: "pointer",
          marginBottom: "12px"
        }}
      >
        Ro'yxatdan o'tish
      </button>

      <button
        onClick={() => navigate("/login")}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "10px",
          border: "2px solid #16a34a",
          background: "#fff",
          color: "#16a34a",
          fontSize: "16px",
          fontWeight: "600",
          cursor: "pointer"
        }}
      >
        Kirish
      </button>
    </div>
  );
};

export default Landing;