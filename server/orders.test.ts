import { describe, expect, it } from "vitest";
import { calculateOrderPrice, formatRupiah } from "../shared/pricing";
import { orderInputSchema } from "./routers";

describe("Pricing and Discount Engine", () => {
  it("calculates single visit price without discount", () => {
    const result = calculateOrderPrice("flex", "single_visit");
    expect(result.basePrice).toBe(50_000);
    expect(result.durationDiscount).toBe(0);
    expect(result.finalPrice).toBe(50_000);
  });

  it("applies 15% discount on 3 months package", () => {
    const result = calculateOrderPrice("unlimited", "3_months");
    // 500,000 * 3 = 1,500,000. 15% = 225,000. Final = 1,275,000
    expect(result.basePrice).toBe(1_500_000);
    expect(result.durationDiscount).toBe(225_000);
    expect(result.finalPrice).toBe(1_275_000);
    expect(result.monthlyEquivalent).toBe(425_000);
  });

  it("applies 25% discount on 6 months package", () => {
    const result = calculateOrderPrice("flex", "6_months");
    // 350,000 * 6 = 2,100,000. 25% = 525,000. Final = 1,575,000
    expect(result.basePrice).toBe(2_100_000);
    expect(result.durationDiscount).toBe(525_000);
    expect(result.finalPrice).toBe(1_575_000);
    expect(result.monthlyEquivalent).toBe(262_500);
  });

  it("applies 40% discount on 1 year package (Best Value)", () => {
    const result = calculateOrderPrice("unlimited", "1_year");
    // 500,000 * 12 = 6,000,000. 40% = 2,400,000. Final = 3,600,000
    expect(result.basePrice).toBe(6_000_000);
    expect(result.durationDiscount).toBe(2_400_000);
    expect(result.finalPrice).toBe(3_600_000);
    expect(result.totalSavings).toBe(2_400_000);
    expect(result.monthlyEquivalent).toBe(300_000);
  });

  it("applies valid promo code ZIUFIRST (10% extra discount)", () => {
    const result = calculateOrderPrice("flex", "1_month", "ZIUFIRST");
    // Base: 350,000. 10% promo = 35,000. Final = 315,000
    expect(result.basePrice).toBe(350_000);
    expect(result.promoDiscount).toBe(35_000);
    expect(result.finalPrice).toBe(315_000);
  });

  it("applies fixed promo code FIT2026 (Rp 50.000 off)", () => {
    const result = calculateOrderPrice("unlimited", "1_month", "FIT2026");
    expect(result.basePrice).toBe(500_000);
    expect(result.promoDiscount).toBe(50_000);
    expect(result.finalPrice).toBe(450_000);
  });

  it("ignores invalid promo codes gracefully", () => {
    const result = calculateOrderPrice("flex", "1_month", "FAKECODE");
    expect(result.promoDiscount).toBe(0);
    expect(result.finalPrice).toBe(350_000);
  });

  it("formats Rupiah correctly", () => {
    expect(formatRupiah(350_000)).toContain("350.000");
  });
});

describe("Order Input Validation", () => {
  it("accepts valid order payload", () => {
    const parsed = orderInputSchema.parse({
      customerName: "Raka Pratama",
      customerEmail: "raka@example.com",
      customerPhone: "081234567890",
      tier: "unlimited",
      duration: "3_months",
      promoCode: "ZIUFIRST",
      paymentMethod: "qris",
    });
    expect(parsed.customerName).toBe("Raka Pratama");
    expect(parsed.duration).toBe("3_months");
  });

  it("rejects invalid email in order", () => {
    expect(() =>
      orderInputSchema.parse({
        customerName: "Raka Pratama",
        customerEmail: "not-an-email",
        customerPhone: "081234567890",
        tier: "unlimited",
        duration: "3_months",
      })
    ).toThrow();
  });
});
