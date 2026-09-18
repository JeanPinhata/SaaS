"use client";

import { useActionState, useEffect, useState } from "react";
import { Ban, BriefcaseBusiness, Check, DoorOpen, Pencil, Plus, Stethoscope, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveProfessionalAction, saveRoomAction, saveServiceAction, saveSpecialtyAction, toggleRecordStatusAction, type CatalogState } from "@/app/professionals/actions";
import type { Professional, Room, Service, Specialty } from "@/lib/types";

type Section = "professionals" | "specialties" | "services" | "rooms";
type CatalogRecord = Professional | Specialty | Service | Room;
const labels: Record<Section, string> = { professionals: "Profissionais", specialties: "Especialidades", services: "Serviços", rooms: "Salas" };
const initial: CatalogState = {};

function CatalogForm({ section, specialties, record, onClose }: { section: Section; specialties: Specialty[]; record?: CatalogRecord | null; onClose: () => void }) {
  const router = useRouter();
  const actionFor = { professionals: saveProfessionalAction, specialties: saveSpecialtyAction, services: saveServiceAction, rooms: saveRoomAction }[section];
  const [state, action, pending] = useActionState(actionFor, initial);

  useEffect(() => {
    if (state.success) {
      router.refresh();
      const timer = setTimeout(() => onClose(), 600);
      return () => clearTimeout(timer);
    }
  }, [router, state.success, onClose]);

  const prof = section === "professionals" ? (record as Professional | undefined) : undefined;
  const spec = section === "specialties" ? (record as Specialty | undefined) : undefined;
  const serv = section === "services" ? (record as Service | undefined) : undefined;
  const room = section === "rooms" ? (record as Room | undefined) : undefined;

  return (
    <form action={action} className="record-form">
      {record?.id ? <input type="hidden" name="id" value={record.id} /> : null}

      {section === "professionals" ? (
        <>
          <label>Nome completo<input name="name" defaultValue={prof?.name} required placeholder="Dra. Marina Costa" /></label>
          <label>Especialidade
            <input
              name="specialty"
              type="text"
              defaultValue={prof?.specialtyId ? (specialties.find((item) => item.id === prof.specialtyId)?.name ?? "") : ""}
              required
              placeholder="Ex.: Cardiologia, Pediatria..."
              list="specialty-suggestions"
              autoComplete="off"
            />
            <datalist id="specialty-suggestions">
              {specialties.map((item) => (
                <option key={item.id} value={item.name} />
              ))}
            </datalist>
          </label>
          <label>Registro profissional<input name="registration" defaultValue={prof?.registration} required placeholder="CRM-SP 000000" /></label>
          <label>Telefone<input name="phone" defaultValue={prof?.phone} required placeholder="(11) 99999-0000" /></label>
          <label>E-mail<input name="email" type="email" defaultValue={prof?.email} required placeholder="contato@clinica.com" /></label>
        </>
      ) : null}

      {section === "specialties" ? (
        <label>Nome da especialidade<input name="name" defaultValue={spec?.name} required placeholder="Ex.: Pediatria" /></label>
      ) : null}

      {section === "services" ? (
        <>
          <label>Nome do serviço<input name="name" defaultValue={serv?.name} required placeholder="Ex.: Consulta" /></label>
          <label>Duração (minutos)<input name="durationMinutes" type="number" min="5" defaultValue={serv?.durationMinutes ?? 30} required /></label>
          <label>Valor (R$)<input name="price" type="number" min="0" step="0.01" defaultValue={serv?.price ?? 150} required /></label>
        </>
      ) : null}

      {section === "rooms" ? (
        <>
          <label>Nome da sala<input name="name" defaultValue={room?.name} required placeholder="Ex.: Consultório 3" /></label>
          <label>Descrição<input name="description" defaultValue={room?.description} placeholder="Uso principal da sala" /></label>
        </>
      ) : null}

      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="success-message">{state.success}</p> : null}
      <button className="primary-button full" disabled={pending}>
        {pending ? "Salvando..." : `${record ? "Atualizar" : "Salvar"} ${labels[section].slice(0, -1).toLowerCase()}`}
      </button>
    </form>
  );
}

export function CatalogManager({ professionals, specialties, services, rooms }: { professionals: Professional[]; specialties: Specialty[]; services: Service[]; rooms: Room[] }) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("professionals");
  const [adding, setAdding] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CatalogRecord | null>(null);

  const records = { professionals, specialties, services, rooms }[section];
  const specialtyName = (id: string) => specialties.find((item) => item.id === id)?.name ?? "Especialidade";

  const typeMap: Record<Section, "professional" | "specialty" | "service" | "room"> = {
    professionals: "professional",
    specialties: "specialty",
    services: "service",
    rooms: "room",
  };

  const handleToggleStatus = async (record: CatalogRecord) => {
    await toggleRecordStatusAction(typeMap[section], record.id, record.status);
    router.refresh();
  };

  return (
    <main className="directory-content">
      <header className="directory-header">
        <div>
          <p className="eyebrow blue">CADASTROS</p>
          <h1>Equipe e operação</h1>
          <p>Profissionais, especialidades, serviços e salas da clínica.</p>
        </div>
        <button className="primary-button" onClick={() => { setEditingRecord(null); setAdding(true); }}>
          <Plus size={16} /> Novo cadastro
        </button>
      </header>

      <div className="catalog-tabs" role="tablist">
        {(Object.keys(labels) as Section[]).map((item) => (
          <button
            key={item}
            className={section === item ? "selected" : ""}
            onClick={() => { setSection(item); setEditingRecord(null); setAdding(false); }}
            role="tab"
          >
            {labels[item]} <span>{({ professionals, specialties, services, rooms }[item]).length}</span>
          </button>
        ))}
      </div>

      <section className="catalog-grid">
        {records.length ? (
          records.map((record) => (
            <article className="catalog-card" key={record.id}>
              {section === "professionals" ? (
                <span className="person-avatar">{(record as Professional).name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span>
              ) : (
                <span className="catalog-icon">
                  {section === "services" ? <BriefcaseBusiness size={18} /> : section === "rooms" ? <DoorOpen size={18} /> : <Stethoscope size={18} />}
                </span>
              )}

              <div>
                <h2>{record.name}</h2>
                {section === "professionals" ? <p>{specialtyName((record as Professional).specialtyId)} · {(record as Professional).registration}</p> : null}
                {section === "services" ? <p>{(record as Service).durationMinutes} min · R$ {(record as Service).price.toFixed(2).replace(".", ",")}</p> : null}
                {section === "rooms" ? <p>{(record as Room).description || "Sem descrição"}</p> : null}
                {section === "specialties" ? <p>Especialidade ativa para agendamentos</p> : null}

                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button
                    onClick={() => { setEditingRecord(record); setAdding(true); }}
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "none", border: 0, color: "#2874df", fontSize: "11px", fontWeight: 700, cursor: "pointer", padding: 0 }}
                  >
                    <Pencil size={13} /> Editar
                  </button>
                  <button
                    onClick={() => handleToggleStatus(record)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "none",
                      border: 0,
                      color: record.status === "ACTIVE" ? "#b86d0a" : "#16875a",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {record.status === "ACTIVE" ? <><Ban size={13} /> Inativar</> : <><Check size={13} /> Reativar</>}
                  </button>
                </div>
              </div>

              <em className={record.status === "ACTIVE" ? "status confirmed" : "status waiting"}>
                {record.status === "ACTIVE" ? "Ativo" : "Inativo"}
              </em>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <Stethoscope size={24} />
            <strong>Nenhum cadastro nesta seção</strong>
            <p>Crie o primeiro item para começar.</p>
          </div>
        )}
      </section>

      {adding ? (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label={`${editingRecord ? "Editar" : "Novo"} cadastro de ${labels[section]}`}>
          <section className="form-sheet">
            <button className="close-button" onClick={() => { setAdding(false); setEditingRecord(null); }} aria-label="Fechar">
              <X size={18} />
            </button>
            <p className="eyebrow blue">{editingRecord ? "EDITAR CADASTRO" : "NOVO CADASTRO"}</p>
            <h2>{editingRecord ? `Editar ${recordTitle(editingRecord)}` : labels[section]}</h2>
            <p>Alterações com escopo seguro exclusivo para sua clínica.</p>
            <CatalogForm
              section={section}
              specialties={specialties}
              record={editingRecord}
              onClose={() => { setAdding(false); setEditingRecord(null); }}
            />
          </section>
        </div>
      ) : null}
    </main>
  );
}

function recordTitle(record: CatalogRecord): string {
  return record.name;
}

