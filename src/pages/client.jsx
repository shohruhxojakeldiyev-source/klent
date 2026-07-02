import React, { useEffect, useState } from "react";
import "../styles/client.css";

import {
  getDoctors,
  getAppointments,
  createAppointment,
  cancelAppointment,
  closeAppointment,
  skipAppointment,
} from "../api/api.js";

// WebSocket — alohida fayldan (src/api/socket.js)
import { connectAppointmentSocket } from "../api/socket.js";

const Client = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointments, setAppointments] = useState([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [myAppointment, setMyAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [alert, setAlert] = useState("");

  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipCount, setSkipCount] = useState("");
  const [maxSkipValue, setMaxSkipValue] = useState(0);


  const loadDoctors = async () => {
    const data = await getDoctors();

    if (Array.isArray(data) && data.length > 0) {
      setDoctors(data);
      if (!selectedDoctor) setSelectedDoctor(String(data[0].id));
      return;
    }

    console.warn("No doctors available from API");
    setDoctors([]);
  };

  const loadAppointments = async (doctorId, silent = false) => {
    if (!doctorId) return [];
    if (!silent) setLoading(true);
    const data = await getAppointments(doctorId);
    const list = Array.isArray(data) ? data : [];
    const normalized = list.map((a) => ({
      id: a.id || a.appointment_id || a.app_id || null,
      doctor_id: a.doctor_id || a.doctor || null,
      patient_name: a.patient_name || a.name || a.patient || "",
      phone: a.phone || a.phone_number || a.tel || "",
      ...a,
    }));

    setAppointments(normalized);

    // Mening navbatim serverda hali bormi tekshiramiz.
    // Yo'q bo'lsa (doktor bekor qilgan, yoki ro'yxat bo'sh) — kartani o'chiramiz.
    setMyAppointment((prev) => {
      if (!prev) return prev;
      const stillExists = normalized.some(
        (a) => String(a.id) === String(prev.id)
      );
      if (!stillExists) {
        localStorage.removeItem("myAppointment");
        return null;
      }
      return prev;
    });

    if (!silent) setLoading(false);
    return normalized;
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      loadAppointments(selectedDoctor);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    const stored = localStorage.getItem("myAppointment");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMyAppointment(parsed);
        const docId = parsed && parsed.doctor_id ? String(parsed.doctor_id) : "";
        if (docId && docId !== selectedDoctor) {
          setSelectedDoctor(docId);
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }, []);

  // ===== WebSocket real-time =====
  // Backend tayyor JSON yuboradi:
  //   { type, queue, title, body }
  //   type: "your_turn" (1) | "prepare" (2) | "queue_update" (3+)
  useEffect(() => {
    if (!myAppointment?.id) return;

    const cleanup = connectAppointmentSocket(myAppointment.id, (data) => {
      let msg;
      try {
        msg = typeof data === "string" ? JSON.parse(data) : data;
      } catch (e) {
        console.warn("WS xabarini o'qib bo'lmadi:", data);
        return;
      }

      // ro'yxatdagi pozitsiyani serverdan kelgan queue bilan yangilaymiz
      if (msg.queue != null) {
        setMyAppointment((prev) =>
          prev ? { ...prev, queue: msg.queue } : prev
        );
      }
      // ro'yxatni ham yangilab qo'yamiz (boshqalar uchun)
      loadAppointments(selectedDoctor);

      // your_turn (1) va prepare (2) da modal chiqaramiz.
      // queue_update (3+) da jim — faqat raqam yangilanadi.
      if (msg.type === "your_turn") {
        setSuccessMsg(`🔔 ${msg.title || "Navbatingiz keldi!"}\n${msg.body || ""}`);
      } else if (msg.type === "prepare") {
        setSuccessMsg(`⏳ ${msg.title || "Tayyorlaning!"}\n${msg.body || ""}`);
      }
    });

    return cleanup;
  }, [myAppointment?.id, selectedDoctor]);

  useEffect(() => {
    if (!selectedDoctor) return;

    const interval = setInterval(() => {
      loadAppointments(selectedDoctor, true);
    }, 7000);

    return () => clearInterval(interval);
  }, [selectedDoctor]);


  const takeTicket = async () => {
    if (myAppointment) {
      setAlert("Sizda allaqachon faol navbat bor. Avval uni bekor qiling yoki tugashini kuting.");
      return;
    }

    const trimmedName = (name || "").trim();
    const trimmedPhone = (phone || "").trim();

    if (!selectedDoctor) return setSuccessMsg("Iltimos doktorni tanlang");
    if (!trimmedName || !trimmedPhone) return setSuccessMsg("Iltimos nom va telefon kiriting");

    setLoading(true);

    try {
      // backendga foydalanuvchi kiritgan telefonni yuboramiz (+998 siz, eski format)
      const res = await createAppointment(selectedDoctor, trimmedName, trimmedPhone);

      if (res && res.message === "appointment created") {
        const appt = {
          id: res.appointment_id || res.id || res.queue,
          doctor_id: selectedDoctor,
          patient_name: trimmedName,
          phone: trimmedPhone,
          queue: res.queue,
        };
        setMyAppointment(appt);
        localStorage.setItem("myAppointment", JSON.stringify(appt));
        setName("");
        setPhone("");
        setSuccessMsg(`Navbat olindi! Navbat raqamingiz: ${res.queue} `);
        await loadAppointments(selectedDoctor);
      } else {
        setAlert("Navbat olishda xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
      setAlert("Xatolik: iltimos keyinroq urinib ko'ring");
    }

    setLoading(false);
  };

  const cancelMyTicket = async () => {
    if (!myAppointment) return;
    setLoading(true);

    try {
      await cancelAppointment(myAppointment.id);
      setMyAppointment(null);
      localStorage.removeItem("myAppointment");
      loadAppointments(selectedDoctor);
    } catch (err) {
      console.error(err);
      setAlert("Bekor qilishda xatolik");
    }

    setLoading(false);
  };

  const skipMyTicket = () => {
    if (!myAppointment) return;

    const currentPos = myPosition();
    const maxSkip = currentPos ? appointments.length - currentPos : 0;

    if (maxSkip < 1) {
      setAlert("Siz allaqachon oxirgi navbatdasiz");
      return;
    }

    setMaxSkipValue(maxSkip);
    setSkipCount("");
    setShowSkipModal(true);
  };

  const confirmSkip = async () => {
    const count = parseInt(skipCount || "0");
    if (!count || count < 1) {
      setShowSkipModal(false);
      return;
    }

    const safeCount = Math.min(count, maxSkipValue);
    setShowSkipModal(false);
    setLoading(true);
    try {
      const res = await skipAppointment(myAppointment.id, safeCount);
      if (res) {
        setSuccessMsg(`Navbat ${safeCount} taga surildi`);
        await loadAppointments(selectedDoctor);
      } else {
        alert("Surishda xatolik");
      }
    } catch (err) {
      console.error(err);
      setAlert("Surishda xatolik");
    }
    setLoading(false);
  };

  const myPosition = () => {
    if (!myAppointment) return null;
    const idx = appointments.findIndex((x) => String(x.id) === String(myAppointment.id));
    return idx === -1 ? null : idx + 1;
  };

  if (doctors.length == 0) return (<div className="clientPage"><p style={{ textAlign: "center", color: "#64748b" }}>Yuklanmoqda...</p></div>)

  return (
    <div className="clientPage">
      <div className="clientTop">
        <h1>Navbat olish</h1>
      </div>

      {successMsg && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          color: "#fff",
          padding: "32px 28px",
          borderRadius: "16px",
          fontWeight: "600",
          fontSize: "16px",
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          width: "320px",
          maxWidth: "calc(100vw - 32px)",
          zIndex: 1000
        }}>
          <span style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: "8px",
            padding: "8px 24px",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer"
          }}>OK</button>
        </div>
      )}


      {alert && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "linear-gradient(135deg, #c41c1cff, #9d1111ff)",
          color: "#fff",
          padding: "32px 28px",
          borderRadius: "16px",
          fontWeight: "600",
          fontSize: "16px",
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          width: "320px",
          maxWidth: "calc(100vw - 32px)",
          zIndex: 1000
        }}>
          <span style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}>{alert}</span>
          <button onClick={() => setAlert("")} style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: "8px",
            padding: "8px 24px",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer"
          }}>OK</button>
        </div>
      )}




      {showSkipModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999, padding: "16px"
        }}>
          <div style={{
            background: "#fff",
            padding: "28px",
            borderRadius: "16px",
            width: "300px",
            maxWidth: "100%",
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
          }}>
            <h3 style={{ margin: "0 0 16px", color: "#0f172a" }}>Nechta navbat surmoqchisiz?</h3>
            <p style={{ margin: "0 0 16px", color: "#64748b" }}>Maksimal: {maxSkipValue}</p>
            <input
              type="number"
              min={1}
              max={maxSkipValue}
              value={skipCount}
              onChange={(e) => setSkipCount(e.target.value)}
              style={{
                width: "100%", padding: "12px", fontSize: "18px",
                textAlign: "center", borderRadius: "10px",
                border: "2px solid #16a34a", marginBottom: "16px",
                color: "#111", background: "#fff",
                boxSizing: "border-box"
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

      {!myAppointment && (
        <>
          <div className="clientSection">
            <label>Doktorni tanlang</label>
            <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
              <option value="">-- Doktorni tanlang --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} - {d.specialization}
                </option>
              ))}
            </select>
          </div>

          <div className="clientSection form">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ism familyangiz"
            />

            {/* Telefon: +998 doim turadi, foydalanuvchi 9 raqam kiritadi */}
            <div style={{ position: "relative", width: "100%" }}>
              <span style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#0f172a",
                fontSize: "16px",
                fontWeight: "500",
                pointerEvents: "none"
              }}>+998</span>
              <input
                value={phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                  setPhone(digits);
                }}
                placeholder=""
                inputMode="numeric"
                style={{ paddingLeft: "60px" }}
              />
            </div>

            <button onClick={takeTicket} disabled={loading} className="takeBtn">
              Navbat olish
            </button>
          </div>
        </>
      )}

      {myAppointment && (
        <div className="myCard">
          <p className="myLabel">Sizning navbatingiz</p>
          <div className="myNumber">{myAppointment.queue ?? myPosition() ?? "-"}</div>

          <p className="myName">
            {myAppointment.patient_name || myAppointment.name || myAppointment.patient || ""}
          </p>

          <div className="myActions">
            <button onClick={cancelMyTicket} className="cancelBtn">Bekor qilish</button>
            <button onClick={skipMyTicket} disabled={loading} className="skipBtn">Surish</button>
          </div>
        </div>
      )}

    {!myAppointment && (
        <div className="queueList">
          <h2>Navbat ro'yxati</h2>
          {loading ? (
            <p>Yuklanmoqda...</p>
          ) : (
            <p>Hozirda navbatda {appointments.length} kishi bor</p>
          )}
        </div>
      )}

    </div>
  );
};

export default Client;