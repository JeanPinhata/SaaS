import type { DemoAppointment, Patient, Professional, Role, Room, Service, Specialty } from "@/lib/types";

const organizationId = "org_clinica_vida";
const demoPasswordHash = "$2b$12$/eeVDwstB83AhLH5U8S78uovEMbROPprHQAWmubmXbBV9zOtsHgFi";

function saoPauloDate(offset = 0) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const lookup = (type: string) => parts.find((part) => part.type === type)?.value ?? "01";
  const date = new Date(Date.UTC(Number(lookup("year")), Number(lookup("month")) - 1, Number(lookup("day")) + offset));
  return date.toISOString().slice(0, 10);
}

const patientNames = [
  "João Silva", "Maria Santos", "Pedro Oliveira", "Fernanda Lima", "Lucas Ferreira", "Ana Souza", "Rafael Almeida",
  "Carla Mendes", "Bruno Santos", "Juliana Costa", "Daniela Rocha", "Marcos Vieira", "Beatriz Lima", "Gabriel Nunes",
  "Patrícia Gomes", "Renato Martins", "Larissa Azevedo", "Eduardo Freitas", "Camila Rocha", "Thiago Barbosa", "Natália Reis",
  "Felipe Andrade", "Sofia Martins", "André Moreira", "Letícia Alves", "Vitor Hugo", "Bianca Ribeiro", "Gustavo Lopes",
];

const professionals = ["Dr. Carlos Mendes", "Dra. Ana Paula", "Dr. Ricardo Alves"];
const times = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30"];

const appointments: DemoAppointment[] = patientNames.map((patientName, index) => ({
  id: `apt_${index + 1}`,
  organizationId,
  patientName,
  professionalName: professionals[index % professionals.length],
  patientId: `patient_${index + 1}`,
  professionalId: `professional_${(index % professionals.length) + 1}`,
  serviceId: "service_1",
  roomId: `room_${(index % 2) + 1}`,
  startsAt: `${saoPauloDate()}T${times[index]}:00-03:00`,
  endsAt: `${saoPauloDate()}T${String(Number(times[index].slice(0, 2)) + (times[index].slice(3) === "30" ? 1 : 0)).padStart(2, "0")}:${times[index].slice(3) === "30" ? "00" : "30"}:00-03:00`,
  status: index < 24 ? "CONFIRMED" : "WAITING_CONFIRMATION",
  expectedAmount: index < 24 ? 160 : 0,
}));

const patients: Patient[] = patientNames.map((fullName, index) => ({
  id: `patient_${index + 1}`,
  organizationId,
  fullName,
  phone: `(11) 9${String(8265 + index).padStart(4, "0")}-${String(4321 + index).padStart(4, "0")}`,
  email: `${fullName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replaceAll(" ", ".")}@exemplo.com`,
  cpf: `123.456.78${String(index).padStart(2, "0")}-00`,
  insuranceName: index % 3 === 0 ? "Unimed" : index % 3 === 1 ? "Particular" : "Bradesco Saúde",
  status: "ACTIVE",
  createdAt: "2025-05-01T12:00:00.000Z",
}));

const specialties: Specialty[] = ["Cardiologia", "Dermatologia", "Clínica Geral"].map((name, index) => ({ id: `specialty_${index + 1}`, organizationId, name, status: "ACTIVE" }));
const professionalRecords: Professional[] = professionals.map((name, index) => ({ id: `professional_${index + 1}`, organizationId, name, specialtyId: specialties[index].id, registration: `CRM-SP ${123456 + index}`, phone: `(11) 9${7000 + index}-0000`, email: `contato${index + 1}@clinicavida.demo`, status: "ACTIVE" }));
const services: Service[] = [
  { id: "service_1", organizationId, name: "Consulta", durationMinutes: 30, price: 160, status: "ACTIVE" },
  { id: "service_2", organizationId, name: "Retorno", durationMinutes: 20, price: 100, status: "ACTIVE" },
  { id: "service_3", organizationId, name: "Avaliação", durationMinutes: 45, price: 220, status: "ACTIVE" },
];
const rooms: Room[] = [
  { id: "room_1", organizationId, name: "Consultório 1", description: "Atendimento clínico", status: "ACTIVE" },
  { id: "room_2", organizationId, name: "Consultório 2", description: "Atendimento clínico", status: "ACTIVE" },
  { id: "room_3", organizationId, name: "Sala de procedimento", description: "Procedimentos ambulatoriais", status: "ACTIVE" },
];

export const demoDatabase = {
  organization: { id: organizationId, name: "Clínica Vida", slug: "clinica-vida", timezone: "America/Sao_Paulo" },
  users: [{ id: "user_ana_souza", name: "Ana Souza", email: "admin@cliniai.demo", passwordHash: demoPasswordHash }],
  memberships: [{ id: "membership_ana", organizationId, userId: "user_ana_souza", role: "OWNER" as Role }],
  professionals: professionalRecords,
  specialties,
  patients,
  services,
  rooms,
  appointments,
  waitingList: ["Rafaela Torres", "Henrique Costa", "Mariana Lopes", "Diego Souza", "Paula Nunes", "Luiz Rocha", "Cecília Alves"],
  weeklyRevenue: [1820, 2360, 2100, 2980, 2420, 1800, 3840],
};

export function todayInSaoPaulo() {
  return saoPauloDate();
}
