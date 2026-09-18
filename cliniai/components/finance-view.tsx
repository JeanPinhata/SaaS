"use client";

import { useActionState, useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CircleDollarSign,
  Clock,
  CreditCard,
  FileSpreadsheet,
  Plus,
  Receipt,
  Wallet,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createExpenseAction, markPaymentPaidAction, type FinanceState } from "@/app/finance/actions";
import type { Expense, FinancialSummary, Payment } from "@/lib/types";

const initial: FinanceState = {};

const currencyFormat = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });

function NewExpenseForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createExpenseAction, initial);

  useEffect(() => {
    if (state.success) {
      router.refresh();
      const timer = setTimeout(() => onClose(), 600);
      return () => clearTimeout(timer);
    }
  }, [router, state.success, onClose]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="record-form">
      <label>
        Descrição da despesa
        <input name="description" required placeholder="Ex.: Aluguel do consultório" />
      </label>

      <label>
        Categoria
        <select name="category" required defaultValue="Infraestrutura">
          <option value="Infraestrutura">Infraestrutura</option>
          <option value="Material Clínico">Material Clínico e Descartáveis</option>
          <option value="Utilidades">Utilidades (Energia, Água)</option>
          <option value="Telecom">Telecom e Internet</option>
          <option value="Tecnologia">Tecnologia e Softwares</option>
          <option value="Serviços Terceiros">Serviços Terceirizados</option>
          <option value="Outros">Outros</option>
        </select>
      </label>

      <label>
        Valor (R$)
        <input name="amount" type="number" step="0.01" min="0.01" required placeholder="0,00" />
      </label>

      <label>
        Data de vencimento
        <input name="dueDate" type="date" defaultValue={today} required />
      </label>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
        <input type="checkbox" id="isPaid" name="isPaid" style={{ width: "16px", height: "16px", cursor: "pointer" }} />
        <label htmlFor="isPaid" style={{ margin: 0, cursor: "pointer", fontSize: "12px", color: "#304d6b" }}>
          Despesa já foi quitada
        </label>
      </div>

      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="success-message">{state.success}</p> : null}

      <button className="primary-button full" disabled={pending}>
        {pending ? "Lançando despesa..." : "Registrar despesa"}
      </button>
    </form>
  );
}

export function FinanceView({
  summary,
  payments,
  expenses,
}: {
  summary: FinancialSummary;
  payments: Payment[];
  expenses: Expense[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"payments" | "expenses">("payments");
  const [openExpenseModal, setOpenExpenseModal] = useState(false);
  const [payingPayment, setPayingPayment] = useState<Payment | null>(null);
  const [selectedMethod, setSelectedMethod] = useState("PIX");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleConfirmPayment = async () => {
    if (!payingPayment) return;
    try {
      setIsProcessingPayment(true);
      await markPaymentPaidAction(payingPayment.id, selectedMethod);
      router.refresh();
      setPayingPayment(null);
    } catch (err) {
      alert("Erro ao confirmar pagamento: " + (err instanceof Error ? err.message : "Desconhecido"));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <main className="directory-content">
      <header className="directory-header">
        <div>
          <p className="eyebrow blue">FINANCEIRO</p>
          <h1>Fluxo de caixa e faturamento</h1>
          <p>Receitas de consultas, pagamentos realizados e controle de despesas da clínica.</p>
        </div>
        <button className="primary-button" onClick={() => setOpenExpenseModal(true)}>
          <Plus size={16} /> Nova despesa
        </button>
      </header>

      {/* Cards de Métricas Principais */}
      <section className="metrics-grid" style={{ marginBottom: "24px" }}>
        <article className="metric-card">
          <div className="metric-icon" style={{ background: "#e8faf2", color: "#1bb170" }}>
            <ArrowUpRight size={18} />
          </div>
          <p>Receita Realizada</p>
          <strong>{currencyFormat.format(summary.totalReceived)}</strong>
          <span className="trend" style={{ color: "#148654" }}>Consultas liquidadas</span>
        </article>

        <article className="metric-card">
          <div className="metric-icon" style={{ background: "#fff7e8", color: "#e3921b" }}>
            <Clock size={18} />
          </div>
          <p>Receita Pendente</p>
          <strong>{currencyFormat.format(summary.totalPending)}</strong>
          <span className="trend" style={{ color: "#c47a0c" }}>A receber na recepção</span>
        </article>

        <article className="metric-card">
          <div className="metric-icon" style={{ background: "#fdf0f0", color: "#d94c4c" }}>
            <ArrowDownRight size={18} />
          </div>
          <p>Despesas Totais</p>
          <strong>{currencyFormat.format(summary.totalExpenses)}</strong>
          <span className="trend warning">Custos operacionais</span>
        </article>

        <article className="metric-card">
          <div className="metric-icon" style={{ background: "#eef5ff", color: "#2577f4" }}>
            <Wallet size={18} />
          </div>
          <p>Saldo Líquido</p>
          <strong style={{ color: summary.netBalance >= 0 ? "#148654" : "#d94c4c" }}>
            {currencyFormat.format(summary.netBalance)}
          </strong>
          <span className="trend" style={{ color: "#4f7091" }}>Resultado do período</span>
        </article>
      </section>

      {/* Tabs */}
      <div className="catalog-tabs" role="tablist">
        <button
          className={activeTab === "payments" ? "selected" : ""}
          onClick={() => setActiveTab("payments")}
          role="tab"
        >
          <CircleDollarSign size={15} style={{ marginRight: "6px", verticalAlign: "middle" }} />
          Recebimentos de Consultas <span>{payments.length}</span>
        </button>
        <button
          className={activeTab === "expenses" ? "selected" : ""}
          onClick={() => setActiveTab("expenses")}
          role="tab"
        >
          <Receipt size={15} style={{ marginRight: "6px", verticalAlign: "middle" }} />
          Despesas Operacionais <span>{expenses.length}</span>
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === "payments" ? (
        <section className="directory-card">
          <div className="data-summary">
            <span><strong>{payments.length}</strong> transações registradas</span>
            <span>{currencyFormat.format(summary.totalReceived)} recebidos</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fbfe", borderTop: "1px solid #edf2f6", borderBottom: "1px solid #edf2f6", color: "#778a9e", height: "38px" }}>
                  <th style={{ padding: "0 16px" }}>PACIENTE</th>
                  <th style={{ padding: "0 16px" }}>VALOR</th>
                  <th style={{ padding: "0 16px" }}>MÉTODO</th>
                  <th style={{ padding: "0 16px" }}>DATA</th>
                  <th style={{ padding: "0 16px" }}>STATUS</th>
                  <th style={{ padding: "0 16px", textAlign: "right" }}>AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #eef3f7", height: "54px" }}>
                    <td style={{ padding: "0 16px" }}>
                      <strong style={{ color: "#223b54", display: "block" }}>{p.patientName}</strong>
                      <small style={{ color: "#8395a7" }}>{p.notes || "Consulta agendada"}</small>
                    </td>
                    <td style={{ padding: "0 16px", fontWeight: 700, color: "#1f374e" }}>
                      {currencyFormat.format(p.amount)}
                    </td>
                    <td style={{ padding: "0 16px", color: "#546a81" }}>
                      {p.paymentMethod}
                    </td>
                    <td style={{ padding: "0 16px", color: "#6e8499" }}>
                      {dateFormat.format(new Date(p.createdAt))}
                    </td>
                    <td style={{ padding: "0 16px" }}>
                      <em className={p.status === "PAID" ? "status confirmed" : "status waiting"}>
                        {p.status === "PAID" ? "Pago" : "Pendente"}
                      </em>
                    </td>
                    <td style={{ padding: "0 16px", textAlign: "right" }}>
                      {p.status === "PENDING" ? (
                        <button
                          onClick={() => setPayingPayment(p)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "5px 10px",
                            background: "#2477f4",
                            color: "#fff",
                            border: 0,
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <Check size={13} /> Dar baixa
                        </button>
                      ) : (
                        <span style={{ color: "#1b9b63", fontSize: "11px", fontWeight: 650 }}>Liquidado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="directory-card">
          <div className="data-summary">
            <span><strong>{expenses.length}</strong> despesas cadastradas</span>
            <span>Total previsto: {currencyFormat.format(summary.totalExpenses)}</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fbfe", borderTop: "1px solid #edf2f6", borderBottom: "1px solid #edf2f6", color: "#778a9e", height: "38px" }}>
                  <th style={{ padding: "0 16px" }}>DESCRIÇÃO</th>
                  <th style={{ padding: "0 16px" }}>CATEGORIA</th>
                  <th style={{ padding: "0 16px" }}>VALOR</th>
                  <th style={{ padding: "0 16px" }}>VENCIMENTO</th>
                  <th style={{ padding: "0 16px" }}>SITUAÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #eef3f7", height: "54px" }}>
                    <td style={{ padding: "0 16px" }}>
                      <strong style={{ color: "#223b54" }}>{e.description}</strong>
                    </td>
                    <td style={{ padding: "0 16px", color: "#546a81" }}>
                      <span style={{ background: "#f0f4f8", padding: "3px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: 600 }}>
                        {e.category}
                      </span>
                    </td>
                    <td style={{ padding: "0 16px", fontWeight: 700, color: "#c94646" }}>
                      {currencyFormat.format(e.amount)}
                    </td>
                    <td style={{ padding: "0 16px", color: "#6e8499" }}>
                      {e.dueDate}
                    </td>
                    <td style={{ padding: "0 16px" }}>
                      <em className={e.paidAt ? "status confirmed" : "status waiting"}>
                        {e.paidAt ? "Pago" : "A vencer"}
                      </em>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal Nova Despesa */}
      {openExpenseModal ? (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Nova despesa">
          <section className="form-sheet">
            <button className="close-button" onClick={() => setOpenExpenseModal(false)} aria-label="Fechar">
              <X size={18} />
            </button>
            <p className="eyebrow blue">NOVA DESPESA</p>
            <h2>Lançar despesa</h2>
            <p>Registre saídas e custos operacionais da clínica.</p>
            <NewExpenseForm onClose={() => setOpenExpenseModal(false)} />
          </section>
        </div>
      ) : null}

      {/* Modal Dar Baixa em Pagamento */}
      {payingPayment ? (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Confirmar pagamento">
          <section className="form-sheet">
            <button className="close-button" onClick={() => setPayingPayment(null)} aria-label="Fechar">
              <X size={18} />
            </button>
            <p className="eyebrow blue">RECEBIMENTO</p>
            <h2>Confirmar pagamento</h2>
            <p>Registrar o recebimento da consulta na recepção.</p>

            <div style={{ background: "#f5f9fd", padding: "16px", borderRadius: "10px", border: "1px solid #e1ecf6", marginBottom: "20px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#6e8499" }}>Paciente</p>
              <strong style={{ fontSize: "14px", color: "#1b334c" }}>{payingPayment.patientName}</strong>
              <p style={{ margin: "10px 0 4px", fontSize: "11px", color: "#6e8499" }}>Valor a receber</p>
              <strong style={{ fontSize: "20px", color: "#16875a" }}>{currencyFormat.format(payingPayment.amount)}</strong>
            </div>

            <div className="record-form">
              <label>
                Forma de Pagamento
                <select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)}>
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Boleto">Boleto Bancário</option>
                  <option value="Convênio / Faturamento">Convênio / Faturamento</option>
                </select>
              </label>

              <button
                className="primary-button full"
                onClick={handleConfirmPayment}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? "Gravando recebimento..." : "Confirmar e Dar Baixa"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
