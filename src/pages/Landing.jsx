import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDoctors } from "../api/api";
import { Html5Qrcode } from "html5-qrcode";

const Landing = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [doctorName, setDoctorName] = useState("");
  const [hasDoctorId, setHasDoctorId] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanDebug, setScanDebug] = useState("");
  const html5QrcodeRef = useRef(null);

  useEffect(() => {
    const fromUrl = searchParams.get("doctor_id");
    if (fromUrl) localStorage.setItem("doctor_id", fromUrl);

    const doctorId = fromUrl || localStorage.getItem("doctor_id");
    if (doctorId) {
      setHasDoctorId(true);
      loadDoctorName(doctorId);
    }
  }, []);

  const loadDoctorName = (doctorId) => {
    getDoctors().then((doctors) => {
      if (Array.isArray(doctors)) {
        const found = doctors.find((d) => String(d.id) === String(doctorId));
        if (found) setDoctorName(found.name);
      }
    });
  };

  const handleQRResult = (text) => {
    setScanError("");
    setScanDebug("O'qildi: " + text);
    let doctorId = null;

    try {
      const url = new URL(text);
      const match = url.pathname.match(/\/createApp\/(\d+)/);
      if (match) {
        doctorId = match[1];
      } else {
        setScanError("URL topildi lekin createApp/:id formati yo'q. Path: " + url.pathname);
      }
    } catch {
      if (/^\d+$/.test(text.trim())) {
        doctorId = text.trim();
      } else {
        setScanError("URL ham emas, son ham emas: " + text);
      }
    }

    if (doctorId) {
      localStorage.setItem("doctor_id", doctorId);
      stopScanner();
      setShowScanner(false);
      setHasDoctorId(true);
      loadDoctorName(doctorId);
    }
  };

  const stopScanner = () => {
    if (html5QrcodeRef.current) {
      html5QrcodeRef.current.stop().catch(() => {});
      html5QrcodeRef.current = null;
    }
  };

  useEffect(() => {
    if (!showScanner) return;

    const qrcode = new Html5Qrcode("qr-scanner-region");
    html5QrcodeRef.current = qrcode;

    qrcode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decodedText) => handleQRResult(decodedText),
      () => {}
    ).catch(() => {
      setScanError("Kamera ochilmadi. Ruxsat bering va qayta urinib ko'ring.");
      setShowScanner(false);
    });

    return () => stopScanner();
  }, [showScanner]);

  // ── Scanner oynasi ─────────────────────────────────────────────────────────
  if (showScanner) {
    return (
      <div style={{ maxWidth: "400px", margin: "0 auto" }}>
        <div style={{
          background: "#fff", borderRadius: "16px",
          overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
        }}>
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
            display: "flex", alignItems: "center", gap: "12px"
          }}>
            <button
              onClick={() => { stopScanner(); setShowScanner(false); }}
              style={{
                background: "#f1f5f9", border: "none", borderRadius: "8px",
                width: "36px", height: "36px", fontSize: "18px",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", flexShrink: 0
              }}
            >←</button>
            <span style={{ fontWeight: "600", color: "#0f172a", fontSize: "16px" }}>
              QR kodni skaner qiling
            </span>
          </div>

          <div id="qr-scanner-region" style={{ width: "100%" }} />

          {scanDebug && (
            <div style={{
              padding: "10px 16px", background: "#f0fdf4",
              color: "#166534", fontSize: "12px",
              wordBreak: "break-all", borderTop: "1px solid #dcfce7"
            }}>
              <b>O'qilgan matn:</b> {scanDebug}
            </div>
          )}
          {scanError && (
            <div style={{
              padding: "12px 16px", background: "#fee2e2",
              color: "#dc2626", fontSize: "13px",
              wordBreak: "break-all", textAlign: "center"
            }}>
              {scanError}
            </div>
          )}

          <p style={{
            padding: "14px 16px", margin: 0,
            textAlign: "center", color: "#64748b", fontSize: "13px"
          }}>
            Kamerani doktorning QR kodiga qarating
          </p>
        </div>
      </div>
    );
  }

  // ── QR kod yo'q ────────────────────────────────────────────────────────────
  if (!hasDoctorId) {
    return (
      <div style={{
        maxWidth: "400px", margin: "0 auto", background: "#fff",
        borderRadius: "16px", padding: "40px 24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)", textAlign: "center"
      }}>
        <div style={{
          width: "96px", height: "96px", margin: "0 auto 24px",
          background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
          borderRadius: "24px", display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: "46px"
        }}>📷</div>

        <h3 style={{ margin: "0 0 10px", color: "#0f172a", fontSize: "20px" }}>
          QR kodni skaner qiling
        </h3>
        <p style={{
          color: "#64748b", fontSize: "14px",
          lineHeight: "1.7", margin: "0 0 32px"
        }}>
          Navbat olish uchun klinikadagi doktor stolidagi QR kodni skaner qiling
        </p>

        <button
          onClick={() => { setScanError(""); setShowScanner(true); }}
          style={{
            width: "100%", padding: "15px", borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#fff", fontSize: "16px", fontWeight: "600",
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", gap: "10px",
            boxShadow: "0 4px 12px rgba(22,163,74,0.3)"
          }}
        >
          <span style={{ fontSize: "20px" }}>📷</span>
          Kamera orqali skaner
        </button>
      </div>
    );
  }

  // ── Doktor topildi ─────────────────────────────────────────────────────────
  return (
    <div style={{
      maxWidth: "400px", margin: "0 auto", background: "#fff",
      borderRadius: "16px", padding: "40px 24px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)", textAlign: "center"
    }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏥</div>

      {doctorName ? (
        <>
          <p style={{ color: "#64748b", marginBottom: "4px", fontSize: "14px" }}>Doktor</p>
          <h2 style={{ margin: "0 0 28px", color: "#0f172a" }}>{doctorName}</h2>
        </>
      ) : (
        <div style={{ height: "52px", marginBottom: "28px" }} />
      )}

      <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>Navbat olish</h3>
      <p style={{ color: "#64748b", marginBottom: "32px", fontSize: "14px" }}>
        Davom etish uchun tanlang
      </p>

      <button
        onClick={() => navigate("/register")}
        style={{
          width: "100%", padding: "14px", borderRadius: "10px",
          border: "none",
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          color: "#fff", fontSize: "16px", fontWeight: "600",
          cursor: "pointer", marginBottom: "12px",
          boxShadow: "0 4px 12px rgba(22,163,74,0.25)"
        }}
      >
        Ro'yxatdan o'tish
      </button>

      <button
        onClick={() => navigate("/login")}
        style={{
          width: "100%", padding: "14px", borderRadius: "10px",
          border: "2px solid #16a34a", background: "#fff",
          color: "#16a34a", fontSize: "16px", fontWeight: "600",
          cursor: "pointer"
        }}
      >
        Kirish
      </button>
    </div>
  );
};

export default Landing;
