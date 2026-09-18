"use client";

import { Bot, CalendarPlus, Clock3, Send, UsersRound } from "lucide-react";
import { useState } from "react";

const actions = [["Agendar consulta", CalendarPlus], ["Novo paciente", UsersRound], ["Enviar lembretes", Send], ["Ver lista de espera", Clock3], ["Perguntar à IA", Bot]] as const;

export function QuickActions() {
  const [message, setMessage] = useState<string | null>(null);
  return <section className="panel quick-actions" aria-labelledby="quick-actions-title"><div className="panel-heading"><h2 id="quick-actions-title">Ações rápidas</h2></div><div className="quick-action-grid">{actions.map(([label, Icon]) => <button key={label} onClick={() => setMessage(`${label} estará disponível na próxima fase.`)}><span className="quick-icon"><Icon size={17} /></span>{label}</button>)}</div>{message ? <p className="inline-feedback" role="status">{message}</p> : null}</section>;
}
