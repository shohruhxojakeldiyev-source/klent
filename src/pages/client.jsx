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

    if (!selectedDoctor) return alert("Iltimos doktorni tanlang");
    if (!trimmedName || !trimmedPhone) return alert("Iltimos nom va telefon kiriting");

    setLoading(true);

    try {
      const res = await createAppointment(selectedDoctor, trimmedName, trimmedPhone);

      if (res && res.message === "appointment created") {
        const appt = {
          id: res.queue,
          doctor_id: selectedDoctor,
          patient_name: trimmedName,
          phone: trimmedPhone,
          queue: res.queue,
        };
        setMyAppointment(appt);
        localStorage.setItem("myAppointment", JSON.stringify(appt));
        setName("");
        setPhone("");
        alert(`✅ Navbat muvaffaqiyatli olindi! Navbat raqamingiz: ${res.queue}`);
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

  const skipMyTicket = async () => {
  if (!myAppointment) return;

  const currentPos = myPosition();
  const maxSkip = currentPos ? appointments.length - currentPos : 0;

  if (maxSkip < 1) {
    alert("Siz allaqachon oxirgi navbatdasiz");
    return;
  }

  const count = parseInt(prompt(`Nechta navbat surmoqchisiz? (maksimal ${maxSkip})`) || "0");
  if (!count || count < 1) return;

  const safeCount = Math.min(count, maxSkip);

  setLoading(true);
  try {
    const res = await skipAppointment(myAppointment.id, safeCount);
    if (res) {
      alert(`✅ Navbat ${safeCount} taga surildi`);
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
