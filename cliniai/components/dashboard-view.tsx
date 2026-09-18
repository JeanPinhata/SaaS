import { AlertCircle, ArrowUpRight, CalendarCheck2, ChevronRight, CircleDollarSign, Clock3, MoreHorizontal, UsersRound } from "lucide-react";
import { QuickActions } from "@/components/quick-actions";
import type { DashboardData } from "@/lib/types";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export function DashboardView({ data }: { data: DashboardData }) {
  const maxRevenue = Math.max(...data.weeklyRevenue.map((item) => item.value));
  const metrics = [
    ["Consultas hoje", data.appointmentCount, "12% vs. ontem", CalendarCheck2, "positive"],
    ["Pacientes confirmados", `${data.confirmedCount} de ${data.appointmentCount}`, "86% da agenda", UsersRound, "positive"],
    ["Faturamento previsto", currency.format(data.expectedRevenue), "10% vs. ontem", CircleDollarSign, "positive"],
    ["Pacientes pendentes", data.pendingCount, "Precisam confirmar", Clock3, "warning"]
  ] as const;

  const userFullName = data.userFullName || data.userName;
  const userRole = data.userRole || "Administradora";
  const initials = getInitials(userFullName);
  const rawDate = dateFormatter.format(new Date());
  const formattedDate = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <main className="dashboard-content">
      <header className="topbar">
        <div>
          <h1>Bom dia, {data.userName}! <span aria-hidden>👋</span></h1>
          <p>Aqui está o resumo da sua clínica hoje.</p>
        </div>
        <div className="topbar-meta">
          <span>{formattedDate}</span>
          <span className="avatar">{initials}</span>
          <div>
            <strong>{userFullName}</strong>
            <small>{userRole}</small>
          </div>
          <MoreHorizontal size={18} />
        </div>
      </header>
      <section className="metrics-grid" aria-label="Indicadores de hoje">
        {metrics.map(([label, value, detail, Icon, tone]) => (
          <article className="metric-card" key={label}>
            <div className="metric-icon"><Icon size={19} /></div>
            <p>{label}</p>
            <strong>{value}</strong>
            <span className={tone === "warning" ? "trend warning" : "trend"}>
              {tone === "positive" ? <ArrowUpRight size={13} /> : <AlertCircle size={13} />}
              {detail}
            </span>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <QuickActions />
        <section className="panel schedule-panel" aria-labelledby="schedule-title">
          <div className="panel-heading">
            <h2 id="schedule-title">Agenda de hoje</h2>
            <button className="icon-button" aria-label="Mais opções"><MoreHorizontal size={18} /></button>
          </div>
          <div className="schedule-list">
            {data.todaySchedule.length === 0 ? (
              <p className="empty-state-text" style={{ padding: "1.5rem", color: "#64748b", textAlign: "center" }}>
                Nenhuma consulta agendada para hoje.
              </p>
            ) : (
              data.todaySchedule.map((appointment) => (
                <div className="schedule-item" key={appointment.id}>
                  <time>{time.format(new Date(appointment.startsAt))}</time>
                  <span>
                    <strong>{appointment.patientName}</strong>
                    <small>{appointment.professionalName}</small>
                  </span>
                  <em className={appointment.status === "CONFIRMED" ? "status confirmed" : "status waiting"}>
                    {appointment.status === "CONFIRMED" ? "Confirmado" : "Aguardando"}
                  </em>
                </div>
              ))
            )}
          </div>
          <button className="text-button">Ver agenda completa <ChevronRight size={15} /></button>
        </section>
        <section className="panel revenue-panel" aria-labelledby="revenue-title">
          <div className="panel-heading">
            <div>
              <h2 id="revenue-title">Faturamento dos últimos 7 dias</h2>
              <strong className="revenue-total">
                {currency.format(data.weeklyRevenue.reduce((sum, item) => sum + item.value, 0))}
              </strong>
            </div>
            <span className="trend"><ArrowUpRight size={13} />12%</span>
          </div>
          <div className="bar-chart" aria-label="Gráfico de faturamento semanal">
            {data.weeklyRevenue.map((item) => (
              <div className="bar-column" key={item.label}>
                <span style={{ height: `${Math.max(22, (item.value / maxRevenue) * 100)}%` }} />
                <small>{item.label}</small>
              </div>
            ))}
          </div>
          <div className="reminders">
            <div>
              <span className="reminder-icon danger"><AlertCircle size={15} /></span>
              <span>
                <strong>{data.pendingConfirmationCount} pacientes não confirmaram</strong>
                <small>Enviar lembretes agora</small>
              </span>
              <ChevronRight size={16} />
            </div>
            <div>
              <span className="reminder-icon info"><Clock3 size={15} /></span>
              <span>
                <strong>{data.availableTomorrowCount} horários disponíveis amanhã</strong>
                <small>Ver oportunidades na agenda</small>
              </span>
              <ChevronRight size={16} />
            </div>
          </div>
        </section>
      </section>
      <section className="phase-note" id="fase-2">
        <span className="phase-dot" />
        <div>
          <strong>Fase 1 concluída</strong>
          <p>Base da clínica, identidade, permissões e visão operacional estão prontas. Cadastros e agenda avançada entram na Fase 2 e 3.</p>
        </div>
        <span className="wait-count">{data.waitingListCount} na lista de espera</span>
      </section>
    </main>
  );
}
