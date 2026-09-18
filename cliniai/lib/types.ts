export const roles = ["OWNER", "ADMIN", "MANAGER", "SECRETARY", "DOCTOR"] as const;
export type Role = (typeof roles)[number];

export type AppointmentStatus = "CONFIRMED" | "WAITING_CONFIRMATION" | "SCHEDULED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

export type TenantRecord = { organizationId: string };

export type EntityStatus = "ACTIVE" | "INACTIVE";

export type Patient = TenantRecord & {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  cpf?: string;
  insuranceName?: string;
  status: EntityStatus;
  createdAt: string;
};

export type Specialty = TenantRecord & { id: string; name: string; status: EntityStatus };
export type Professional = TenantRecord & { id: string; name: string; specialtyId: string; registration: string; phone: string; email: string; status: EntityStatus };
export type Service = TenantRecord & { id: string; name: string; durationMinutes: number; price: number; status: EntityStatus };
export type Room = TenantRecord & { id: string; name: string; description?: string; status: EntityStatus };

export type DemoAppointment = TenantRecord & {
  id: string;
  patientName: string;
  professionalName: string;
  patientId?: string;
  professionalId?: string;
  serviceId?: string;
  roomId?: string;
  startsAt: string;
  endsAt?: string;
  status: AppointmentStatus;
  expectedAmount: number;
};

export type DashboardData = {
  userName: string;
  userFullName?: string;
  userRole?: string;
  organizationName: string;
  appointmentCount: number;
  confirmedCount: number;
  pendingCount: number;
  expectedRevenue: number;
  todaySchedule: DemoAppointment[];
  pendingConfirmationCount: number;
  availableTomorrowCount: number;
  waitingListCount: number;
  weeklyRevenue: Array<{ label: string; value: number }>;
};

export type PaymentStatus = "PAID" | "PENDING" | "CANCELLED" | "REFUNDED";

export type Payment = TenantRecord & {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  paidAt?: string;
  createdAt: string;
  notes?: string;
};

export type Expense = TenantRecord & {
  id: string;
  description: string;
  category: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
};

export type FinancialSummary = {
  totalReceived: number;
  totalPending: number;
  totalExpenses: number;
  netBalance: number;
};

