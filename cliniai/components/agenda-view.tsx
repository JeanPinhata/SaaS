"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarClock, CalendarPlus, Check, Clock3, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createAppointmentAction, rescheduleAppointmentAction, setAppointmentStatusAction, type AgendaState } from "@/app/agenda/actions";
import type { DemoAppointment, Patient, Professional, Room, Service } from "@/lib/types";

const initial: AgendaState = {};
const clock = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

function RescheduleForm({
  appointment,
  rooms,
  onClose,
}: {
  appointment: DemoAppointment;
  rooms: Room[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(rescheduleAppointmentAction, initial);

  useEffect(() => {
    if (state.success) {
      router.refresh();
      const timer = setTimeout(() => onClose(), 600);
      return () => clearTimeout(timer);
    }
  }, [router, state.success, onClose]);

  const defaultDate = appointment.startsAt.slice(0, 10);
  const defaultTime = appointment.startsAt.slice(11, 16);

  return (
    <form action={action} className="record-form">
      <input type="hidden" name="appointmentId" value={appointment.id} />

      <div style={{ background: "#f5f9fd", padding: "12px", borderRadius: "8px", border: "1px solid #e1ecf6" }}>
        <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#6e8499" }}>Paciente</p>
        <strong style={{ display: "block", color: "#1a2f44", fontSize: "13px" }}>{appointment.patientName}</strong>
        <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#6e8499" }}>Profissional: <span style={{ color: "#224160", fontWeight: 600 }}>{appointment.professionalName}</span></p>
      </div>

      <label>
        Nova data
        <input name="date" type="date" defaultValue={defaultDate} required />
      </label>

      <label>
        Novo horário
        <input name="time" type="time" defaultValue={defaultTime} required />
      </label>

      <label>
        Sala de atendimento
        <select name="roomId" defaultValue={appointment.roomId ?? ""}>
          {rooms.filter((r) => r.status === "ACTIVE" || r.id === appointment.roomId).map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </label>

      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="success-message">{state.success}</p> : null}

      <button className="primary-button full" disabled={pending}>
        {pending ? "Validando novo horário..." : "Confirmar reagendamento"}
      </button>
    </form>
  );
}

export function AgendaView({
  appointments,
  patients,
  professionals,
  services,
  rooms,
  date,
}: {
  appointments: DemoAppointment[];
  patients: Patient[];
  professionals: Professional[];
  services: Service[];
  rooms: Room[];
  date: string;
}) {
  const [open, setOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState<DemoAppointment | null>(null);
  const router = useRouter();
  const [state, action, pending] = useActionState(createAppointmentAction, initial);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);

  const roomName = (id?: string) => {
    const found = rooms.find((r) => r.id === id);
    return found ? found.name : "Consultório Geral";
  };

  return (
    <main className="directory-content">
      <header className="directory-header">
        <div>
          <p className="eyebrow blue">AGENDA</p>
          <h1>Agenda da clínica</h1>
          <p>Horários protegidos contra conflito de profissional e sala.</p>
        </div>
        <button className="primary-button" onClick={() => setOpen(true)}>
          <CalendarPlus size={16} /> Agendar consulta
        </button>
      </header>

      <section className="agenda-toolbar">
        <form>
          <input aria-label="Data da agenda" type="date" name="date" defaultValue={date} />
          <button>Ver data</button>
        </form>
        <span>
          <Clock3 size={15} /> {appointments.length} consultas neste dia
        </span>
      </section>

      <section className="agenda-list">
        {appointments.length ? (
          appointments.map((appointment) => (
            <article className="agenda-item" key={appointment.id}>
              <time>{clock.format(new Date(appointment.startsAt))}</time>
              <div className="agenda-line" />
              <div>
                <strong>{appointment.patientName}</strong>
                <p>
                  {appointment.professionalName} · {roomName(appointment.roomId)}
                </p>
              </div>

              <em
                className={
                  appointment.status === "CONFIRMED"
                    ? "status confirmed"
                    : appointment.status === "WAITING_CONFIRMATION"
                    ? "status waiting"
                    : "status scheduled"
                }
              >
                {appointment.status === "CONFIRMED"
                  ? "Confirmado"
                  : appointment.status === "WAITING_CONFIRMATION"
                  ? "Aguardando"
                  : appointment.status === "SCHEDULED"
                  ? "Agendado"
                  : appointment.status === "CANCELLED"
                  ? "Cancelado"
                  : appointment.status}
              </em>

              <span className="agenda-actions">
                {appointment.status === "SCHEDULED" ? (
                  <button onClick={() => setAppointmentStatusAction(appointment.id, "CONFIRMED").then(() => router.refresh())}>
                    <Check size={15} /> Confirmar
                  </button>
                ) : null}

                {!["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appointment.status) ? (
                  <>
                    <button onClick={() => setRescheduling(appointment)}>
                      <CalendarClock size={15} /> Reagendar
                    </button>
                    <button
                      className="danger-action"
                      onClick={() => setAppointmentStatusAction(appointment.id, "CANCELLED").then(() => router.refresh())}
                    >
                      Cancelar
                    </button>
                  </>
                ) : null}
              </span>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <Clock3 size={24} />
            <strong>Nenhuma consulta agendada para esta data</strong>
            <p>Clique no botão acima para agendar uma nova consulta.</p>
          </div>
        )}
      </section>

      {/* Modal de Criação de Agendamento */}
      {open ? (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Novo agendamento">
          <section className="form-sheet">
            <button className="close-button" onClick={() => setOpen(false)} aria-label="Fechar">
              <X size={18} />
            </button>
            <p className="eyebrow blue">NOVO AGENDAMENTO</p>
            <h2>Agendar consulta</h2>
            <p>O horário será validado novamente no servidor ao salvar.</p>
            <form action={action} className="record-form">
              <label>
                Paciente
                <select name="patientId" defaultValue="" required>
                  <option value="" disabled>Selecione</option>
                  {patients.filter((x) => x.status === "ACTIVE").map((x) => (
                    <option key={x.id} value={x.id}>{x.fullName}</option>
                  ))}
                </select>
              </label>

              <label>
                Profissional
                <select name="professionalId" defaultValue="" required>
                  <option value="" disabled>Selecione</option>
                  {professionals.filter((x) => x.status === "ACTIVE").map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Serviço
                <select name="serviceId" defaultValue="" required>
                  <option value="" disabled>Selecione</option>
                  {services.filter((x) => x.status === "ACTIVE").map((x) => (
                    <option key={x.id} value={x.id}>{x.name} · {x.durationMinutes} min</option>
                  ))}
                </select>
              </label>

              <label>
                Sala
                <select name="roomId" defaultValue="" required>
                  <option value="" disabled>Selecione</option>
                  {rooms.filter((x) => x.status === "ACTIVE").map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Data
                <input name="date" type="date" defaultValue={date} required />
              </label>

              <label>
                Horário
                <input name="time" type="time" required />
              </label>

              {state.error ? <p className="form-error">{state.error}</p> : null}
              {state.success ? <p className="success-message">{state.success}</p> : null}
              <button className="primary-button full" disabled={pending}>
                {pending ? "Validando horário..." : "Confirmar agendamento"}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {/* Modal de Reagendamento */}
      {rescheduling ? (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Reagendar consulta">
          <section className="form-sheet">
            <button className="close-button" onClick={() => setRescheduling(null)} aria-label="Fechar">
              <X size={18} />
            </button>
            <p className="eyebrow blue">REAGENDAMENTO</p>
            <h2>Reagendar consulta</h2>
            <p>Selecione uma nova data e horário protegidos contra conflitos.</p>
            <RescheduleForm
              appointment={rescheduling}
              rooms={rooms}
              onClose={() => setRescheduling(null)}
            />
          </section>
        </div>
      ) : null}
    </main>
  );
}

