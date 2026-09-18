import { describe, expect, it } from "vitest";
import { getClinicalAnalytics } from "../services/reports";

const ownerContext = {
  userId: "user_ana_souza",
  organizationId: "org_clinica_vida",
  role: "OWNER" as const,
  organizationName: "Clínica Vida",
};

describe("clinical and data science analytics", () => {
  it("generates comprehensive analytics for the tenant", async () => {
    const analytics = await getClinicalAnalytics(ownerContext, "30d");

    expect(analytics.organizationName).toBe("Clínica Vida");
    expect(analytics.projectedRevenue).toBeGreaterThan(0);
    expect(analytics.patientLtv).toBeGreaterThan(0);
    expect(analytics.patientRetentionRate).toBeGreaterThan(0);
  });

  it("calculates predictive no-show metrics and risk level", async () => {
    const analytics = await getClinicalAnalytics(ownerContext, "30d");

    expect(analytics.noShowMetrics).toBeDefined();
    expect(analytics.noShowMetrics.overallRiskRate).toBeGreaterThanOrEqual(0);
    expect(["LOW", "MODERATE", "HIGH"]).toContain(analytics.noShowMetrics.riskLevel);
    expect(analytics.noShowMetrics.topRiskFactors.length).toBeGreaterThan(0);
    expect(analytics.noShowMetrics.prescriptiveRecommendation.length).toBeGreaterThan(10);
  });

  it("builds a complete 2D occupancy heatmap", async () => {
    const analytics = await getClinicalAnalytics(ownerContext, "30d");

    expect(analytics.occupancyHeatmap.days.length).toBe(6);
    expect(analytics.occupancyHeatmap.hours.length).toBe(10);
    expect(analytics.occupancyHeatmap.cells.length).toBe(60);
    expect(analytics.occupancyHeatmap.averageOccupancy).toBeGreaterThanOrEqual(0);
    expect(analytics.occupancyHeatmap.peakHour).toBeDefined();
  });

  it("computes Pareto 80/20 analysis sorted descending with cumulative percentage", async () => {
    const analytics = await getClinicalAnalytics(ownerContext, "30d");

    expect(analytics.paretoServices.length).toBeGreaterThan(0);
    // Verificar ordenação decrescente de faturamento
    for (let i = 1; i < analytics.paretoServices.length; i++) {
      expect(analytics.paretoServices[i - 1].revenue).toBeGreaterThanOrEqual(analytics.paretoServices[i].revenue);
    }
    // O último item acumulado deve ser 100%
    const lastItem = analytics.paretoServices[analytics.paretoServices.length - 1];
    expect(lastItem.cumulativePercentage).toBe(100);
  });

  it("forecasts future revenue points with upper and lower confidence bounds", async () => {
    const analytics = await getClinicalAnalytics(ownerContext, "30d");

    expect(analytics.revenueForecast.length).toBeGreaterThan(4);
    const projectedPoint = analytics.revenueForecast.find((p) => p.forecast !== undefined);
    expect(projectedPoint).toBeDefined();
    if (projectedPoint && projectedPoint.upperBound && projectedPoint.lowerBound) {
      expect(projectedPoint.upperBound).toBeGreaterThanOrEqual(projectedPoint.lowerBound);
    }
  });

  it("enforces tenant isolation and rejects unauthorized cross-tenant requests", async () => {
    await expect(
      getClinicalAnalytics({ ...ownerContext, organizationId: "org_other_clinic" }, "30d")
    ).rejects.toThrow("Tenant access denied");
  });
});
