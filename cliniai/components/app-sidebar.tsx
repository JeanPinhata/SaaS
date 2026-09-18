import { Bell, Bot, CalendarDays, ChartNoAxesCombined, ChevronDown, CircleDollarSign, HeartPulse, LayoutDashboard, MessageCircle, Settings, Stethoscope, UsersRound } from "lucide-react";
import { signOutAction } from "@/app/dashboard/actions";

const navigation = [["Dashboard", "/dashboard", LayoutDashboard], ["Agenda", "/agenda", CalendarDays], ["Pacientes", "/patients", UsersRound], ["Profissionais", "/professionals", Stethoscope], ["Financeiro", "/finance", CircleDollarSign], ["WhatsApp / IA", "#fase-6", Bot], ["Mensagens", "#fase-5", MessageCircle], ["Relatórios", "#fase-8", ChartNoAxesCombined], ["Configurações", "#fase-7", Settings]] as const;


function getInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AppSidebar({
  organizationName,
  userName,
  userRole = "Administradora",
  active = "Dashboard",
}: {
  organizationName: string;
  userName: string;
  userRole?: string;
  active?: string;
}) {
  const initials = getInitials(userName);
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <span className="brand-mark"><HeartPulse size={18} /></span>
          <strong>CliniAI</strong>
        </div>
        <nav aria-label="Navegação principal" className="sidebar-nav">
          {navigation.map(([label, href, Icon]) => (
            <a
              href={href}
              key={label}
              className={label === active ? "nav-link active" : "nav-link"}
              aria-current={label === active ? "page" : undefined}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Mensagens" ? <span className="nav-badge">3</span> : null}
            </a>
          ))}
        </nav>
      </div>
      <div className="sidebar-bottom">
        <div className="clinic-switcher">
          <span className="clinic-emblem"><HeartPulse size={15} /></span>
          <span>
            <strong>{organizationName}</strong>
            <small>Plano Pro</small>
          </span>
          <ChevronDown size={15} />
        </div>
        <div className="profile-row">
          <span className="avatar">{initials}</span>
          <span>
            <strong>{userName}</strong>
            <small>{userRole}</small>
          </span>
          <form action={signOutAction}>
            <button aria-label="Sair da conta" title="Sair"><Bell size={16} /></button>
          </form>
        </div>
      </div>
    </aside>
  );
}
