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

const Client = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointments, setAppointments] = useState([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [myAppointment, setMyAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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

    // Empty doctors list
    console.warn("No doctors available from API");
    setDoctors([]);
  };

  const loadAppointments = async (doctorId) => {
    if (!doctorId) return [];
    setLoading(true);
    const data = await getAppointments(doctorId);
    const list = Array.isArray(data) ? data : [];
    // normalize each item to ensure consistent fields used by the UI
    const normalized = list.map((a) => ({
      id: a.id || a.appointment_id || a.app_id || null,
      doctor_id: a.doctor_id || a.doctor || null,
      patient_name: a.patient_name || a.name || a.patient || "",
      phone: a.phone || a.phone_number || a.tel || "",
      ...a,
    }));

    setAppointments(normalized);
    setLoading(false);
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
        // if doctor changed, refresh appointments
        const docId = parsed && parsed.doctor_id ? String(parsed.doctor_id) : "";
        if (docId && docId !== selectedDoctor) {
          setSelectedDoctor(docId);
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }, []);

  const takeTicket = async () => {

    const trimmedName = (name || "").trim();
    const trimmedPhone = (phone || "").trim();

    if (!selectedDoctor) return setSuccessMsg("Iltimos doktorni tanlang");
    if (!trimmedName || !trimmedPhone) return setSuccessMsg("Iltimos nom va telefon kiriting");

    setLoading(true);

    try {
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
        setSuccessMsg(`✅ Navbat muvaffaqiyatli olindi! Navbat raqamingiz: ${res.queue}`);
        await loadAppointments(selectedDoctor);
      } else {
        alert("Navbat olishda xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
      alert("Xatolik: iltimos keyinroq urinib ko'ring");
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
      alert("Bekor qilishda xatolik");
    }

    setLoading(false);
  };

  // Navbatni tugatish
  const finishMyTicket = async () => {
    if (!myAppointment) return;
    setLoading(true);
    try {
      await closeAppointment(myAppointment.id);
      setMyAppointment(null);
      localStorage.removeItem("myAppointment");
      loadAppointments(selectedDoctor);
    } catch (err) {
      console.error(err);
      alert("Tugatishda xatolik");
    }
    setLoading(false);
  };

  const skipMyTicket = () => {
    if (!myAppointment) return;

    const currentPos = myPosition();
    const maxSkip = currentPos ? appointments.length - currentPos : 0;

    if (maxSkip < 1) {
      alert("Siz allaqachon oxirgi navbatdasiz");
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
      alert("Surishda xatolik");
    }
    setLoading(false);
  };

  const myPosition = () => {
    if (!myAppointment) return null;
    const idx = appointments.findIndex((x) => String(x.id) === String(myAppointment.id));
    return idx === -1 ? null : idx + 1;
  };

  if (doctors.length == 0) return (<div>Loading...</div>)

  return (
    <div className="clientPage">
      <div className="clientTop">
        <h1>👥 Mijoz - Navbat olish</h1>
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
          zIndex: 1000
        }}>

          <span>✅ {successMsg}</span>
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

      {showSkipModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999
        }}>
          <div style={{
            background: "#fff",
            padding: "28px",
            borderRadius: "16px",
            width: "300px",
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
          }}>
            <h3 style={{ margin: "0 0 16px" }}>Nechta navbat surmoqchisiz?</h3>
            <p style={{ margin: "0 0 16px" }}>Maksimal: {maxSkipValue}</p>
            <input
              type="number"
              min=""
              max={maxSkipValue}
              value={skipCount}
              onChange={(e) => setSkipCount(e.target.value)}
              style={{
                width: "100%", padding: "10px", fontSize: "18px",
                textAlign: "center", borderRadius: "8px",
                border: "2px solid #16a34a", marginBottom: "16px",
                color: "#111", background: "#013916ff",
                boxSizing: "border-box"
              }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setShowSkipModal(false)} style={{
                flex: 1, padding: "10px", borderRadius: "8px",
                border: "none", background: "#de0d11ff", cursor: "pointer"
              }}>Bekor qilish</button>
              <button onClick={confirmSkip} style={{
                flex: 1, padding: "10px", borderRadius: "8px",
                border: "none", background: "#013916ff", color: "#fff",
                fontWeight: "600", cursor: "pointer"
              }}>Tasdiqlash</button>
            </div>
          </div>
        </div>
      )}

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
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism familyangiz" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefon nomer" />

        <button onClick={takeTicket} disabled={loading} className="takeBtn">
          Navbat olish
        </button>
      </div>

      {myAppointment && (
        <div className="myCard">
          <h3>Sizning navbatingiz</h3>
          <p>#{myAppointment.id}</p>
          <p>{myAppointment.patient_name || myAppointment.name || myAppointment.patient || ""}</p>
          <p>{myAppointment.phone}</p>
          <p>Pozitsiya: {myPosition() ?? "-"}</p>

          <div className="myActions">
            <div className="myActions">
              <button onClick={cancelMyTicket} className="cancelBtn">❌ Bekor qilish</button>
              <button onClick={skipMyTicket} disabled={loading} className="skipBtn">⏭️ Surish</button>
            </div>
          </div>
        </div>
      )}

      <div className="queueList">
        <h2>Navbat ro'yxati</h2>
        {loading ? (
          <p>Yuklanmoqda...</p>
        ) : appointments.length === 0 ? (
          <p>Navbat yo'q</p>
        ) : (
          appointments.map((a, i) => (
            <div key={a.id} className={`queueItem ${myAppointment && String(myAppointment.id) === String(a.id) ? 'mine' : ''}`}>
              <div className="num">#{i + 1}</div>
              <div className="info">
                <div className="name">{a.patient_name || a.name || a.patient || "-"}</div>
                <div className="phone">{a.phone || "-"}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Client;
