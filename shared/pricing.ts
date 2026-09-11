import type { PlanDuration } from "./types";

export type PlanTier = "flex" | "unlimited" | "coach";

export interface PricingConfig {
  name: string;
  tagline: string;
  singleVisitPrice: number;
  monthlyBasePrice: number;
  features: string[];
}

export const PLAN_CONFIGS: Record<PlanTier, PricingConfig> = {
  flex: {
    name: "Flex",
    tagline: "Untuk ritme latihan santai & konsisten.",
    singleVisitPrice: 50_000,
    monthlyBasePrice: 350_000,
    features: [
      "Akses area gym & free weights",
      "Loker reguler harian",
      "Shower & ruang ganti bersih",
      "Akses jam non-peak & reguler",
    ],
  },
  unlimited: {
    name: "Unlimited",
    tagline: "Prioritas latihan tanpa batasan jam.",
    singleVisitPrice: 75_000,
    monthlyBasePrice: 500_000,
    features: [
      "Akses 24/7 tanpa batasan waktu",
      "Seluruh fasilitas gym & cardio zone",
      "Loker VIP & fasilitas sauna",
      "Free 1x konsultasi fitness",
      "Diskon 10% merchandise Ziu Gym",
    ],
  },
  coach: {
    name: "Coach",
    tagline: "Progres maksimal dengan bimbingan personal trainer.",
    singleVisitPrice: 150_000,
    monthlyBasePrice: 1_200_000,
    features: [
      "Semua fasilitas paket Unlimited",
      "Sesi pendampingan pelatih privat",
      "Program latihan & pola makan khusus",
      "Evaluasi InBody berkala bulanan",
      "Prioritas booking studio & area khusus",
    ],
  },
};

export interface DurationOption {
  id: PlanDuration;
  label: string;
  months: number;
  isSingleVisit: boolean;
  discountPercentage: number;
  badge?: string;
  bonus?: string;
}

export const DURATION_OPTIONS: DurationOption[] = [
  {
    id: "single_visit",
    label: "Sekali Visit",
    months: 0,
    isSingleVisit: true,
    discountPercentage: 0,
    badge: "Fleksibel",
  },
  {
    id: "1_month",
    label: "1 Bulan",
    months: 1,
    isSingleVisit: false,
    discountPercentage: 0,
    badge: "Standar",
  },
  {
    id: "3_months",
    label: "3 Bulan",
    months: 3,
    isSingleVisit: false,
    discountPercentage: 15,
    badge: "POPULER",
    bonus: "Hemat 15% dari total harga bulanan",
  },
  {
    id: "6_months",
    label: "6 Bulan",
    months: 6,
    isSingleVisit: false,
    discountPercentage: 25,
    badge: "HEMAT 25%",
    bonus: "Gratis 1x Tes Komposisi Tubuh (InBody)",
  },
  {
    id: "1_year",
    label: "1 Tahun",
    months: 12,
    isSingleVisit: false,
    discountPercentage: 40,
    badge: "BEST VALUE · HEMAT 40%",
    bonus: "Gratis Tas & Shaker Ziu Exclusive + 2 Guest Passes",
  },
];

export interface PromoCode {
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
  description: string;
}

export const VALID_PROMO_CODES: Record<string, PromoCode> = {
  ZIUFIRST: {
    code: "ZIUFIRST",
    discountType: "percentage",
    value: 10,
    description: "Diskon ekstra 10% untuk member baru",
  },
  FIT2026: {
    code: "FIT2026",
    discountType: "fixed",
    value: 50_000,
    description: "Potongan langsung Rp 50.000",
  },
  STUDENT: {
    code: "STUDENT",
    discountType: "percentage",
    value: 15,
    description: "Diskon 15% khusus pelajar & mahasiswa",
  },
};

export interface PriceCalculationResult {
  tier: PlanTier;
  duration: PlanDuration;
  tierName: string;
  durationLabel: string;
  basePrice: number;
  durationDiscount: number;
  priceAfterDurationDiscount: number;
  promoCode?: string;
  promoDiscount: number;
  promoDescription?: string;
  finalPrice: number;
  monthlyEquivalent: number;
  dailyEquivalent: number;
  totalSavings: number;
}

export function calculateOrderPrice(
  tier: PlanTier,
  duration: PlanDuration,
  promoCodeInput?: string
): PriceCalculationResult {
  const config = PLAN_CONFIGS[tier] || PLAN_CONFIGS.flex;
  const durationOpt = DURATION_OPTIONS.find((d) => d.id === duration) || DURATION_OPTIONS[1];

  let rawBasePrice = 0;
  let durationDiscount = 0;

  if (durationOpt.isSingleVisit) {
    rawBasePrice = config.singleVisitPrice;
    durationDiscount = 0;
  } else {
    rawBasePrice = config.monthlyBasePrice * durationOpt.months;
    durationDiscount = Math.round((rawBasePrice * durationOpt.discountPercentage) / 100);
  }

  const priceAfterDuration = Math.max(0, rawBasePrice - durationDiscount);

  let promoDiscount = 0;
  let validatedPromo: PromoCode | undefined;

  if (promoCodeInput) {
    const cleanCode = promoCodeInput.trim().toUpperCase();
    validatedPromo = VALID_PROMO_CODES[cleanCode];
    if (validatedPromo) {
      if (validatedPromo.discountType === "percentage") {
        promoDiscount = Math.round((priceAfterDuration * validatedPromo.value) / 100);
      } else {
        promoDiscount = Math.min(priceAfterDuration, validatedPromo.value);
      }
    }
  }

  const finalPrice = Math.max(0, priceAfterDuration - promoDiscount);
  const totalSavings = durationDiscount + promoDiscount;

  const effectiveMonths = durationOpt.isSingleVisit ? 1 : durationOpt.months;
  const monthlyEquivalent = Math.round(finalPrice / effectiveMonths);
  const dailyEquivalent = Math.round(monthlyEquivalent / 30);

  return {
    tier,
    duration,
    tierName: config.name,
    durationLabel: durationOpt.label,
    basePrice: rawBasePrice,
    durationDiscount,
    priceAfterDurationDiscount: priceAfterDuration,
    promoCode: validatedPromo?.code,
    promoDiscount,
    promoDescription: validatedPromo?.description,
    finalPrice,
    monthlyEquivalent,
    dailyEquivalent,
    totalSavings,
  };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
