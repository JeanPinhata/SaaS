"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  Flame,
  LineChart,
  PieChart,
  Printer,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ClinicalAnalyticsSummary, PeriodFilter } from "@/lib/types";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function ReportsView({ data }: { data: ClinicalAnalyticsSummary }) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>(data.period);

  // Exportação para CSV completo
  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push(`Relatório Analítico de Inteligência Clínica - ${data.organizationName}`);
    lines.push(`Gerado em: ${new Date(data.generatedAt).toLocaleString("pt-BR")}`);
    lines.push(`Período: ${selectedPeriod}`);
    lines.push("");

    lines.push("--- INDICADORES GERAIS ---");
    lines.push(`Receita Realizada;${data.totalRevenue}`);
    lines.push(`Receita Projetada (+30d);${data.projectedRevenue}`);
    lines.push(`Taxa de No-Show (Abstenção);${data.noShowMetrics.overallRiskRate}%`);
    lines.push(`LTV Médio por Paciente;${data.patientLtv}`);
    lines.push(`Taxa de Retenção;${data.patientRetentionRate}%`);
    lines.push("");

    lines.push("--- ANÁLISE DE PARETO DE SERVIÇOS ---");
    lines.push("Procedimento/Serviço;Faturamento (R$);Participação (%);Acumulado (%)");
    data.paretoServices.forEach((s) => {
      lines.push(`${s.name};${s.revenue};${s.percentage}%;${s.cumulativePercentage}%`);
    });
    lines.push("");

    lines.push("--- DISTRIBUIÇÃO DEMOGRÁFICA ---");
    lines.push("Faixa Etária;Pacientes;Participação (%)");
    data.demographics.ageGroups.forEach((g) => {
      lines.push(`${g.label};${g.count};${g.percentage}%`);
    });
    lines.push("");

    lines.push("--- CONVÊNIOS E FONTES PAGADORAS ---");
    lines.push("Fonte Pagadora;Pacientes;Participação (%)");
    data.demographics.insurances.forEach((i) => {
      lines.push(`${i.name};${i.count};${i.percentage}%`);
    });

    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_cliniai_${selectedPeriod}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Cores dinâmicas para o mapa de calor de ocupação
  const getHeatmapColor = (rate: number) => {
    if (rate === 0) return "#f8fafc";
    if (rate <= 25) return "#e0f2fe"; // azul bem suave
    if (rate <= 50) return "#bae6fd"; // azul claro
    if (rate <= 75) return "#60a5fa"; // azul intermediário
    if (rate <= 90) return "#2563eb"; // azul escuro
    return "#1d4ed8"; // azul pico saturado
  };

  const getHeatmapTextColor = (rate: number) => {
    return rate > 50 ? "#ffffff" : "#334155";
  };

  // Cálculo para SVG da Curva de Previsão de Faturamento
  const forecastChart = useMemo(() => {
    const pts = data.revenueForecast;
    if (pts.length === 0) return null;

    const width = 680;
    const height = 220;
    const padding = { top: 25, right: 35, bottom: 35, left: 55 };

    const allValues = pts.flatMap((p) => [
      p.actual ?? 0,
      p.forecast ?? 0,
      p.upperBound ?? 0,
      p.lowerBound ?? 0,
    ]).filter((v) => v > 0);

    const minVal = Math.min(...allValues) * 0.85;
    const maxVal = Math.max(...allValues) * 1.12;

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const getX = (idx: number) => padding.left + (idx / (pts.length - 1)) * chartW;
    const getY = (val: number) => padding.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;

    // Pontos reais
    const actualPoints: Array<{ x: number; y: number; label: string; val: number }> = [];
    // Pontos projetados
    const forecastPoints: Array<{ x: number; y: number; label: string; val: number; low: number; up: number }> = [];

    pts.forEach((p, i) => {
      if (p.actual !== undefined) {
        actualPoints.push({ x: getX(i), y: getY(p.actual), label: p.date, val: p.actual });
      }
      if (p.forecast !== undefined) {
        forecastPoints.push({
          x: getX(i),
          y: getY(p.forecast),
          label: p.date,
          val: p.forecast,
          low: p.lowerBound ?? p.forecast,
          up: p.upperBound ?? p.forecast,
        });
      }
    });

    const actualPath = actualPoints.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x},${pt.y}`).join(" ");
    const forecastPath = forecastPoints.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x},${pt.y}`).join(" ");

    // Polígono de Banda de Confiança (Confidence Interval Ribbon)
    let ribbonPath = "";
    if (forecastPoints.length > 1) {
      const topEdge = forecastPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${getY(p.up)}`).join(" ");
      const bottomEdge = [...forecastPoints].reverse().map((p) => `L ${p.x},${getY(p.low)}`).join(" ");
      ribbonPath = `${topEdge} ${bottomEdge} Z`;
    }

    return {
      width,
      height,
      actualPoints,
      forecastPoints,
      actualPath,
      forecastPath,
      ribbonPath,
      minVal,
      maxVal,
      getY,
      padding,
    };
  }, [data.revenueForecast]);

  return (
    <main className="directory-content">
      {/* Cabeçalho Executivo */}
      <header className="directory-header" style={{ marginBottom: "20px" }}>
        <div>
          <p className="eyebrow blue">DATA SCIENCE & CLINICAL INTELLIGENCE</p>
          <h1>Relatórios Preditivos & Gestão Clínica</h1>
          <p>
            Análise probabilística de abstenção, matriz de calor operacional, projeção de faturamento e curva de Pareto.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Seletor de Período */}
          <div
            style={{
              display: "inline-flex",
              padding: "3px",
              background: "#e8eff7",
              borderRadius: "8px",
              gap: "2px",
            }}
          >
            {(["7d", "30d", "90d", "12m"] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                style={{
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: 0,
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: selectedPeriod === p ? "#2577f4" : "transparent",
                  color: selectedPeriod === p ? "#ffffff" : "#4b6177",
                  transition: "0.15s ease",
                }}
              >
                {p === "7d" ? "7 Dias" : p === "30d" ? "30 Dias" : p === "90d" ? "90 Dias" : "12 Meses"}
              </button>
            ))}
          </div>

          <button
            className="primary-button"
            style={{ background: "#ffffff", color: "#2577f4", border: "1px solid #d4e3f3" }}
            onClick={handleExportCSV}
            title="Exportar dados consolidados em formato CSV"
          >
            <Download size={15} /> Exportar CSV
          </button>

          <button className="primary-button" onClick={handlePrint} title="Imprimir Relatório Executivo">
            <Printer size={15} /> Imprimir
          </button>
        </div>
      </header>

      {/* Banner de Boas-vindas para Clínicas Recém-Criadas */}
      {data.activePatientCount === 0 && data.noShowMetrics.totalAppointments === 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            padding: "16px 20px",
            background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
            border: "1px solid #bbf7d0",
            borderRadius: "12px",
            marginBottom: "22px",
            boxShadow: "0 4px 14px rgba(34, 197, 94, 0.08)",
          }}
        >
          <span
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#16a34a",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Sparkles size={20} />
          </span>
          <div>
            <strong style={{ fontSize: "14px", color: "#14532d", display: "block", marginBottom: "3px" }}>
              Bem-vinda à {data.organizationName}! Esta é a sua central de Inteligência Preditiva.
            </strong>
            <p style={{ margin: 0, fontSize: "12px", color: "#166534", lineHeight: 1.5 }}>
              Sua clínica foi criada com sucesso e está com os dados 100% isolados. Conforme você cadastrar seus primeiros pacientes na aba <strong>Pacientes</strong> e agendar consultas na <strong>Agenda</strong>, os modelos de Inteligência Artificial, a projeção de faturamento, a análise de Pareto e o mapa de calor térmico começarão a gerar análises preditivas em tempo real para a sua gestão.
            </p>
          </div>
        </div>
      )}

      {/* 4 Scorecards Executivos */}
      <section className="metrics-grid" style={{ marginBottom: "22px" }}>
        {/* Receita Projetada */}
        <article className="metric-card">
          <div className="metric-icon" style={{ background: "#e8faf2", color: "#148654" }}>
            <TrendingUp size={19} />
          </div>
          <p>Faturamento Projetado (+30d)</p>
          <strong>{currency.format(data.projectedRevenue)}</strong>
          <span className="trend" style={{ color: "#148654" }}>
            <ArrowUpRight size={13} /> +{data.revenueGrowthRate}% vs histórico
          </span>
        </article>

        {/* Taxa de No-Show Preditivo */}
        <article className="metric-card">
          <div
            className="metric-icon"
            style={{
              background: data.noShowMetrics.riskLevel === "HIGH" ? "#fee2e2" : data.noShowMetrics.riskLevel === "MODERATE" ? "#fef3c7" : "#e0f2fe",
              color: data.noShowMetrics.riskLevel === "HIGH" ? "#dc2626" : data.noShowMetrics.riskLevel === "MODERATE" ? "#d97706" : "#0284c7",
            }}
          >
            <BrainCircuit size={19} />
          </div>
          <p>Índice Preditivo de No-Show</p>
          <strong>{data.noShowMetrics.overallRiskRate}%</strong>
          <span
            className="trend"
            style={{
              color: data.noShowMetrics.riskLevel === "HIGH" ? "#dc2626" : data.noShowMetrics.riskLevel === "MODERATE" ? "#d97706" : "#0284c7",
            }}
          >
            {data.noShowMetrics.riskLevel === "LOW" ? "Operação Estável" : data.noShowMetrics.riskLevel === "MODERATE" ? "Atenção Necessária" : "Risco Elevado"}
          </span>
        </article>

        {/* Taxa de Ocupação Média */}
        <article className="metric-card">
          <div className="metric-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>
            <Flame size={19} />
          </div>
          <p>Taxa de Ocupação Clínica</p>
          <strong>{data.occupancyHeatmap.averageOccupancy}%</strong>
          <span className="trend" style={{ color: "#7c3aed" }}>
            Pico: {data.occupancyHeatmap.peakHour}
          </span>
        </article>

        {/* LTV & Retenção de Pacientes */}
        <article className="metric-card">
          <div className="metric-icon" style={{ background: "#eef5ff", color: "#2577f4" }}>
            <Users size={19} />
          </div>
          <p>LTV Médio por Paciente</p>
          <strong>{currency.format(data.patientLtv)}</strong>
          <span className="trend" style={{ color: "#2577f4" }}>
            {data.patientRetentionRate}% taxa de retenção
          </span>
        </article>
      </section>

      {/* Grid Central: Inteligência Preditiva de No-Show + Mapa de Calor */}
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.95fr", gap: "18px", marginBottom: "22px" }}>
        {/* Painel 1: Modelo Preditivo de Abstenção & Prescrição da IA */}
        <section className="directory-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <BrainCircuit size={17} />
              </span>
              <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 750, color: "#1e293b" }}>
                Previsão de No-Show & IA
              </h2>
            </div>
            <span
              className="status"
              style={{
                background: data.noShowMetrics.riskLevel === "HIGH" ? "#fef2f2" : data.noShowMetrics.riskLevel === "MODERATE" ? "#fffbeb" : "#f0fdf4",
                color: data.noShowMetrics.riskLevel === "HIGH" ? "#b91c1c" : data.noShowMetrics.riskLevel === "MODERATE" ? "#b45309" : "#15803d",
                fontWeight: 700,
              }}
            >
              {data.noShowMetrics.riskLevel === "LOW" ? "Risco Baixo" : data.noShowMetrics.riskLevel === "MODERATE" ? "Risco Moderado" : "Risco Crítico"}
            </span>
          </div>

          <div
            style={{
              padding: "14px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Impacto financeiro estimado de faltas</span>
              <strong style={{ fontSize: "16px", color: "#dc2626" }}>
                {currency.format(data.noShowMetrics.estimatedRevenueLoss)}
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8" }}>
              Calculado sobre {data.noShowMetrics.noShowAppointments} ausências potenciais no período selecionado.
            </p>
          </div>

          {/* Fatores Determinantes de Risco (Feature Importance) */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 700, color: "#334155" }}>
              Principais Fatores Determinantes de Falta:
            </p>
            <div style={{ display: "grid", gap: "8px" }}>
              {data.noShowMetrics.topRiskFactors.map((f) => (
                <div
                  key={f.factor}
                  style={{
                    padding: "9px 11px",
                    background: "#ffffff",
                    border: "1px solid #edf2f7",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ color: "#1e293b", fontWeight: 600 }}>{f.factor}</span>
                    <strong style={{ color: "#d97706", fontSize: "10px" }}>{f.impact}</strong>
                  </div>
                  <div style={{ width: "100%", height: "5px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ width: `${f.weight * 2}%`, height: "100%", background: "#f59e0b", borderRadius: "99px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ação Prescritiva da IA */}
          <div
            style={{
              padding: "14px",
              background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)",
              border: "1px solid #bfdbfe",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", color: "#1d4ed8" }}>
              <Sparkles size={15} />
              <strong style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Recomendação Prescritiva da IA
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: "11px", color: "#1e3a8a", lineHeight: 1.5 }}>
              {data.noShowMetrics.prescriptiveRecommendation}
            </p>
          </div>
        </section>

        {/* Painel 2: Mapa de Calor 2D de Ocupação (Occupancy Heatmap) */}
        <section className="directory-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 750, color: "#1e293b" }}>
                Mapa de Calor de Ocupação Semanal
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#64748b" }}>
                Densidade de carga horária da clínica (08h às 18h). Identifique gargalos e horários ociosos para encaixes.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#64748b" }}>
              <span>Ocioso</span>
              <span style={{ width: "12px", height: "12px", background: "#e0f2fe", borderRadius: "3px", display: "inline-block" }} />
              <span style={{ width: "12px", height: "12px", background: "#60a5fa", borderRadius: "3px", display: "inline-block" }} />
              <span style={{ width: "12px", height: "12px", background: "#1d4ed8", borderRadius: "3px", display: "inline-block" }} />
              <span>Saturado</span>
            </div>
          </div>

          {/* Matriz 2D */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "4px", fontSize: "11px" }}>
              <thead>
                <tr>
                  <th style={{ width: "45px", textAlign: "left", color: "#64748b", fontWeight: 700, padding: "4px" }}>
                    Hora
                  </th>
                  {data.occupancyHeatmap.days.map((day) => (
                    <th key={day} style={{ textAlign: "center", color: "#475569", fontWeight: 700, padding: "4px" }}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.occupancyHeatmap.hours.map((hour) => (
                  <tr key={hour}>
                    <td style={{ color: "#64748b", fontWeight: 700, fontSize: "10px", padding: "4px" }}>
                      {String(hour).padStart(2, "0")}:00
                    </td>
                    {data.occupancyHeatmap.days.map((_, dayIdx) => {
                      const dayNumber = dayIdx + 1;
                      const cell = data.occupancyHeatmap.cells.find(
                        (c) => c.dayOfWeek === dayNumber && c.hour === hour
                      );
                      const rate = cell?.occupancyRate ?? 0;
                      const count = cell?.appointmentCount ?? 0;
                      return (
                        <td
                          key={dayIdx}
                          style={{
                            height: "32px",
                            background: getHeatmapColor(rate),
                            color: getHeatmapTextColor(rate),
                            borderRadius: "6px",
                            textAlign: "center",
                            fontWeight: 700,
                            fontSize: "10px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          title={`${rate}% de ocupação (${count} atendimentos)`}
                        >
                          {rate}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "14px",
              paddingTop: "12px",
              borderTop: "1px solid #edf2f7",
              fontSize: "11px",
              color: "#64748b",
            }}
          >
            <span>
              ⚡ <strong>Janela de Oportunidade:</strong> {data.occupancyHeatmap.lowestHour} (ideal para ações de reengajamento).
            </span>
            <span>
              🔥 <strong>Pico de Carga:</strong> {data.occupancyHeatmap.peakHour}
            </span>
          </div>
        </section>
      </div>

      {/* Linha 2: Gráfico de Previsão de Faturamento (Séries Temporais) + Curva de Pareto */}
      <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: "18px", marginBottom: "22px" }}>
        {/* Gráfico Preditivo de Faturamento */}
        <section className="directory-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 750, color: "#1e293b" }}>
                Previsão Preditiva de Faturamento (+30 Dias)
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#64748b" }}>
                Regressão linear com faixa de intervalo de confiança de 95% (cenário otimista e conservador).
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "10px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#2563eb", fontWeight: 700 }}>
                <span style={{ width: "14px", height: "3px", background: "#2563eb", display: "inline-block" }} /> Histórico
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#7c3aed", fontWeight: 700 }}>
                <span style={{ width: "14px", height: "3px", background: "#7c3aed", display: "inline-block", borderTop: "2px dashed #7c3aed" }} /> Projeção
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#93c5fd" }}>
                <span style={{ width: "12px", height: "8px", background: "#dbeafe", borderRadius: "2px", display: "inline-block" }} /> Banda Confiança
              </span>
            </div>
          </div>

          {forecastChart && (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <svg
                viewBox={`0 0 ${forecastChart.width} ${forecastChart.height}`}
                style={{ width: "100%", height: "auto", display: "block" }}
              >
                {/* Linhas de grade horizontais */}
                {[0.2, 0.5, 0.8].map((ratio) => {
                  const val = forecastChart.minVal + ratio * (forecastChart.maxVal - forecastChart.minVal);
                  const y = forecastChart.getY(val);
                  return (
                    <g key={ratio}>
                      <line
                        x1={forecastChart.padding.left}
                        y1={y}
                        x2={forecastChart.width - forecastChart.padding.right}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      <text x={forecastChart.padding.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                        {currency.format(val)}
                      </text>
                    </g>
                  );
                })}

                {/* Ribbon de Intervalo de Confiança */}
                {forecastChart.ribbonPath && (
                  <path d={forecastChart.ribbonPath} fill="#eff6ff" opacity="0.85" />
                )}

                {/* Linha de Histórico Real */}
                <path d={forecastChart.actualPath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />

                {/* Linha de Projeção Preditiva */}
                <path
                  d={forecastChart.forecastPath}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                />

                {/* Pontos de Histórico */}
                {forecastChart.actualPoints.map((pt, idx) => (
                  <g key={`act-${idx}`}>
                    <circle cx={pt.x} cy={pt.y} r="4" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
                    <text x={pt.x} y={forecastChart.height - 10} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600">
                      {pt.label}
                    </text>
                  </g>
                ))}

                {/* Pontos de Projeção */}
                {forecastChart.forecastPoints.map((pt, idx) => (
                  <g key={`fc-${idx}`}>
                    <circle cx={pt.x} cy={pt.y} r="4" fill="#ffffff" stroke="#7c3aed" strokeWidth="2" />
                    <text x={pt.x} y={forecastChart.height - 10} textAnchor="middle" fontSize="9" fill="#7c3aed" fontWeight="700">
                      {pt.label}
                    </text>
                    <text x={pt.x} y={pt.y - 8} textAnchor="middle" fontSize="9" fill="#4c1d95" fontWeight="800">
                      {currency.format(pt.val)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </section>

        {/* Análise de Pareto (Curva ABC 80/20) */}
        <section className="directory-card" style={{ padding: "20px" }}>
          <div style={{ marginBottom: "14px" }}>
            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 750, color: "#1e293b" }}>
              Curva de Pareto de Serviços (80/20)
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#64748b" }}>
              Identificação dos procedimentos de maior retorno financeiro para a clínica.
            </p>
          </div>

          {data.paretoServices.length === 0 ? (
            <div style={{ padding: "30px 14px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              <p style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                Nenhum procedimento faturado ainda
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>
                Conforme as consultas forem realizadas, os procedimentos de maior impacto financeiro aparecerão aqui.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "9px" }}>
              {data.paretoServices.map((s, idx) => (
                <div
                  key={s.name}
                  style={{
                    padding: "9px 11px",
                    background: idx < 2 ? "#eff6ff" : "#f8fafc",
                    border: idx < 2 ? "1px solid #bfdbfe" : "1px solid #edf2f7",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ color: "#1e293b", fontWeight: 700 }}>
                      {idx + 1}. {s.name}
                    </span>
                    <strong style={{ color: idx < 2 ? "#1d4ed8" : "#475569" }}>
                      {currency.format(s.revenue)}
                    </strong>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "99px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${s.percentage * 2}%`,
                          height: "100%",
                          background: idx < 2 ? "linear-gradient(90deg, #3b82f6, #1d4ed8)" : "#94a3b8",
                          borderRadius: "99px",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, minWidth: "55px", textAlign: "right" }}>
                      {s.percentage}% ({s.cumulativePercentage}% acum.)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Linha 3: Demografia dos Pacientes & Matriz de Convênios */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
        {/* Distribuição por Faixa Etária */}
        <section className="directory-card" style={{ padding: "20px" }}>
          <div style={{ marginBottom: "14px" }}>
            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 750, color: "#1e293b" }}>
              Pirâmide Etária dos Pacientes
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#64748b" }}>
              Composição demográfica da base ativa para direcionamento de especialidades.
            </p>
          </div>

          {data.activePatientCount === 0 ? (
            <div style={{ padding: "30px 14px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              <p style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                Nenhum paciente cadastrado ainda
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>
                Cadastre seus primeiros pacientes na aba Pacientes para visualizar a pirâmide etária da sua clínica.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "9px" }}>
              {data.demographics.ageGroups.map((g) => (
                <div key={g.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
                    <span style={{ color: "#334155", fontWeight: 600 }}>{g.label} anos</span>
                    <strong style={{ color: "#0f172a" }}>
                      {g.count} pacientes ({g.percentage}%)
                    </strong>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.max(4, g.percentage)}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #60a5fa, #2563eb)",
                        borderRadius: "99px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Matriz de Convênios vs Particular */}
        <section className="directory-card" style={{ padding: "20px" }}>
          <div style={{ marginBottom: "14px" }}>
            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 750, color: "#1e293b" }}>
              Participação de Convênios & Particular
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#64748b" }}>
              Volume de atendimentos por operadora e procedimentos particulares.
            </p>
          </div>

          {data.demographics.insurances.length === 0 ? (
            <div style={{ padding: "30px 14px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              <p style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                Sem convênios registrados
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>
                A divisão entre consultas particulares e convênios aparecerá assim que os atendimentos forem registrados.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "9px" }}>
              {data.demographics.insurances.map((ins) => (
                <div key={ins.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
                    <span style={{ color: "#334155", fontWeight: 600 }}>{ins.name}</span>
                    <strong style={{ color: "#0f172a" }}>
                      {ins.count} atendimentos ({ins.percentage}%)
                    </strong>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.max(4, ins.percentage)}%`,
                        height: "100%",
                        background: ins.name === "Particular" ? "linear-gradient(90deg, #10b981, #059669)" : "linear-gradient(90deg, #818cf8, #4f46e5)",
                        borderRadius: "99px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
