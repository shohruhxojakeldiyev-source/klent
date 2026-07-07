import React, { useEffect, useState } from "react";
import "../styles/client.css";
import { useNavigate } from "react-router-dom";

import {
  getAppointments,
  cancelAppointment,
  skipAppointment,
} from "../api/api.js";

import { connectAppointmentSocket } from "../api/socket.js";

const Client = () => {
  const navigate = useNavigate();

  const [myAppointment, setMyAppointment] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipCount, setSkipCount] = useState("");
  const [maxSkipValue, setMaxSkipValue] = useState(0);

  // localStorage dan navbatni olish
  useEffect(() => {
    const stored = localStorage.getItem("myAppointment");
    if (!stored) {
      navigate("/");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setMyAppointment(parsed);
    } catch {
      navigate("/");
    }
  }, []);

  // Navbatlar ro'yxatini yuklash
  const loadAppointments = async (doctorId, silent = false) => {
    if (!doctorId) return [];
    if (!silent) setLoading(true);
    const data = await getAppointments(doctorId);
    const list = Array.isArray(data) ? data : [];
    const normalized = list.map((a) => ({
      id: a.id || a.appointment_id || null,
      doctor_id: a.doctor_id || null,
      patient_name: a.patient_name || a.name || "",
      phone: a.phone || "",
      queue: a.queue || null,
      ...a,
    }));
    setAppointments(normalized);

    // Navbat hali bormi tekshirish
    setMyAppointment((prev) => {
      if (!prev) return prev;
      const stillExists = normalized.some((a) => String(a.id) === String(prev.id));
      if (!stillExists) {
        localStorage.removeItem("myAppointment");
        return null;
      }
      return prev;
    });

    if (!silent) setLoading(false);
    return normalized;
  };

  // Navbat yuklangandan keyin ro'yxatni yuklash
  useEffect(() => {
    if (myAppointment?.doctor_id) {
      loadAppointments(myAppointment.doctor_id);
    }
  }, [myAppointment?.doctor_id]);

  // 7 soniyada bir yangilash
  useEffect(() => {
    if (!myAppointment?.doctor_id) return;
    const interval = setInterval(() => {
      loadAppointments(myAppointment.doctor_id, true);
    }, 7000);
    return () => clearInterval(interval);
  }, [myAppointment?.doctor_id]);

  // WebSocket
  useEffect(() => {
    if (!myAppointment?.id) return;
    const cleanup = connectAppointmentSocket(myAppointment.id, (data) => {
      let msg;
      try {
        msg = typeof data === "string" ? JSON.parse(data) : data;
      } catch { return; }

      if (msg.queue != null) {
        setMyAppointment((prev) => prev ? { ...prev, queue: msg.queue } : prev);
      }
      if (myAppointment?.doctor_id) loadAppointments(myAppointment.doctor_id, true);

      if (msg.type === "your_turn") {
        setSuccessMsg(`🔔 ${msg.title || "Navbatingiz keldi!"}\n${msg.body || ""}`);
      } else if (msg.type === "prepare") {
        setSuccessMsg(`⏳ ${msg.title || "Tayyorlaning!"}\n${msg.body || ""}`);
      }
    });
    return cleanup;
  }, [myAppointment?.id]);

  // Pozitsiya
  const myPosition = () => {
    if (!myAppointment) return null;
    const idx = appointments.findIndex((x) => String(x.id) === String(myAppointment.id));
    return idx === -1 ? null : idx + 1;
  };

  // Bekor qilish
  const cancelMyTicket = async () => {
    if (!myAppointment) return;
    setLoading(true);
    try {
      await cancelAppointment(myAppointment.id);
      setMyAppointment(null);
      localStorage.removeItem("myAppointment");
      navigate("/");
    } catch {
      setAlertMsg("Bekor qilishda xatolik");
    }
    setLoading(false);
  };

  // Surish
  const skipMyTicket = () => {
    if (!myAppointment) return;
    const currentPos = myPosition();
    const maxSkip = currentPos ? appointments.length - currentPos : 0;
    if (maxSkip < 1) {
      setAlertMsg("Siz allaqachon oxirgi navbatdasiz");
      return;
    }
    setMaxSkipValue(maxSkip);
    setSkipCount("");
    setShowSkipModal(true);
  };

  const confirmSkip = async () => {
    const count = parseInt(skipCount || "0");
    if (!count || count < 1) { setShowSkipModal(false); return; }
    const safeCount = Math.min(count, maxSkipValue);
    setShowSkipModal(false);
    setLoading(true);
    try {
      const res = await skipAppointment(myAppointment.id, safeCount);
      if (res) {
        setSuccessMsg(`Navbat ${safeCount} taga surildi`);
        if (myAppointment?.doctor_id) await loadAppointments(myAppointment.doctor_id);
      } else {
        setAlertMsg("Surishda xatolik");
      }
    } catch {
      setAlertMsg("Surishda xatolik");
    }
    setLoading(false);
  };

  if (!myAppointment) return <div style={{ textAlign: "center", padding: "40px" }}>Yuklanmoqda...</div>;

  return (
    <div className="clientPage">

      {/* Yashil modal */}
      {successMsg && (
        <div style={overlayStyle}>
          <div style={modalGreenStyle}>
            <span style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} style={modalBtnStyle}>OK</button>
          </div>
        </div>
      )}

      {/* Qizil modal */}
      {alertMsg && (
        <div style={overlayStyle}>
          <div style={modalRedStyle}>
            <span style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}>{alertMsg}</span>
            <button onClick={() => setAlertMsg("")} style={modalBtnStyle}>OK</button>
          </div>
        </div>
      )}

      {/* Surish modali */}
      {showSkipModal && (
        <div style={{ ...overlayStyle, background: "rgba(0,0,0,0.5)" }}>
          <div style={{
            background: "#fff", padding: "28px", borderRadius: "16px",
            width: "300px", maxWidth: "100%", textAlign: "center",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
          }}>
            <h3 style={{ margin: "0 0 16px", color: "#0f172a" }}>Nechta navbat surmoqchisiz?</h3>
            <p style={{ margin: "0 0 16px", color: "#64748b" }}>Maksimal: {maxSkipValue}</p>
            <input
              type="number" min={1} max={maxSkipValue}
              value={skipCount} onChange={(e) => setSkipCount(e.target.value)}
              style={{
                width: "100%", padding: "12px", fontSize: "18px",
                textAlign: "center", borderRadius: "10px",
                border: "2px solid #16a34a", marginBottom: "16px",
                color: "#111", background: "#fff", boxSizing: "border-box"
              }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setShowSkipModal(false)} style={{
                flex: 1, padding: "12px", borderRadius: "10px",
                border: "none", background: "#ef4444", color: "#fff",
                fontWeight: "600", cursor: "pointer"
              }}>Bekor qilish</button>
              <button onClick={confirmSkip} style={{
                flex: 1, padding: "12px", borderRadius: "10px",
                border: "none", background: "#16a34a", color: "#fff",
                fontWeight: "600", cursor: "pointer"
              }}>Tasdiqlash</button>
            </div>
          </div>
        </div>
      )}

      {/* Navbat kartasi */}
      <div className="myCard">
        <p className="myLabel">Sizning navbatingiz</p>
        <div className="myNumber">{myAppointment.queue ?? myPosition() ?? "-"}</div>
        <p className="myName">{myAppointment.patient_name || ""}</p>

        <div className="myActions">
          <button onClick={cancelMyTicket} disabled={loading} className="cancelBtn">
            Bekor qilish
          </button>
          <button onClick={skipMyTicket} disabled={loading} className="skipBtn">
            Surish
          </button>
        </div>
      </div>

    </div>
  );
};

// Stillar
const overlayStyle = {
  position: "fixed", top: "50%", left: "50%",
  transform: "translate(-50%, -50%)",
  zIndex: 1000,
};

const modalGreenStyle = {
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "#fff", padding: "32px 28px", borderRadius: "16px",
  fontWeight: "600", fontSize: "16px", textAlign: "center",
  boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
  display: "flex", flexDirection: "column", alignItems: "center",
  gap: "16px", width: "320px", maxWidth: "calc(100vw - 32px)",
};

const modalRedStyle = {
  ...modalGreenStyle,
  background: "linear-gradient(135deg, #c41c1c, #9d1111)",
};

const modalBtnStyle = {
  background: "rgba(255,255,255,0.2)", border: "none",
  borderRadius: "8px", padding: "8px 24px",
  color: "#fff", fontSize: "16px", fontWeight: "600", cursor: "pointer",
};

export default Client;