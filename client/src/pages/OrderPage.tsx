import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  calculateOrderPrice,
  DURATION_OPTIONS,
  formatRupiah,
  PLAN_CONFIGS,
  PlanTier,
  VALID_PROMO_CODES,
} from "@shared/pricing";
import { PlanDuration } from "@shared/types";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Gift,
  QrCode,
  ShieldCheck,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function OrderPage() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Form states
  const [selectedTier, setSelectedTier] = useState<PlanTier>("unlimited");
  const [selectedDuration, setSelectedDuration] = useState<PlanDuration>("3_months");
  const [promoCodeInput, setPromoCodeInput] = useState("ZIUFIRST");
  const [appliedPromo, setAppliedPromo] = useState("ZIUFIRST");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "bank_transfer" | "cash">("qris");
  const [notes, setNotes] = useState("");

  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  // Live price calculation (instant client-side + validated via tRPC on submit)
  const calculation = useMemo(() => {
    return calculateOrderPrice(selectedTier, selectedDuration, appliedPromo);
  }, [selectedTier, selectedDuration, appliedPromo]);

  const orderMutation = trpc.orders.create.useMutation({
    onSuccess: async (data) => {
      await Promise.all([
        utils.orders.list.invalidate(),
        utils.orders.stats.invalidate(),
        utils.orders.myOrders.invalidate(),
        utils.members.list.invalidate(),
        utils.members.stats.invalidate(),
      ]);
      setSuccessOrder(data.order);
      toast.success("Pesanan berhasil dikonfirmasi!");
    },
    onError: (err) => {
      toast.error(err.message || "Gagal memproses pesanan");
    },
  });

  const handleApplyPromo = () => {
    const clean = promoCodeInput.trim().toUpperCase();
    if (!clean) {
      setAppliedPromo("");
      return;
    }
    if (VALID_PROMO_CODES[clean]) {
      setAppliedPromo(clean);
      toast.success(`Promo ${clean} berhasil diterapkan!`);
    } else {
      toast.error("Kode promo tidak valid atau telah kedaluwarsa.");
    }
  };

  const handleOrderSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone) {
      toast.error("Mohon lengkapi nama, email, dan nomor telepon.");
      return;
    }

    orderMutation.mutate({
      customerName,
      customerEmail,
      customerPhone,
      tier: selectedTier,
      duration: selectedDuration,
      promoCode: appliedPromo || undefined,
      paymentMethod,
      notes: notes || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#101111] text-[#f6f6ef] pb-32 sm:pb-20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#101111]/90 backdrop-blur-xl px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-xs sm:text-sm font-medium text-white/60 hover:text-[#d9ff3f] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </button>
          <div className="flex items-center gap-2 font-display text-sm sm:text-base font-bold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d9ff3f] text-[#151810]">
              <Dumbbell className="h-3.5 w-3.5" />
            </span>
            <span>ZIU / ORDER PORTAL</span>
          </div>
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            size="sm"
            className="rounded-full border-white/20 text-xs hover:border-[#d9ff3f] hover:bg-[#d9ff3f] hover:text-[#151810]"
          >
            Buka Dashboard
          </Button>
        </div>
      </header>

      {/* Hero Banner Flash Promo */}
      <section className="border-b border-[#d9ff3f]/20 bg-gradient-to-r from-[#d9ff3f]/10 via-[#1d2214] to-[#101111] px-4 py-4 text-xs sm:text-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-white/80">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d9ff3f] text-[#151810]">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <span className="font-semibold text-white">Promo Kuota Terbatas:</span>
            <span>Gunakan kode voucher <strong className="text-[#d9ff3f]">ZIUFIRST</strong> untuk ekstra diskon 10%!</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#d9ff3f]">
            <Clock className="h-3.5 w-3.5" />
            <span>Tersisa 4 slot harga promo hari ini</span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
          {/* Left Column: Form & Selections */}
          <form onSubmit={handleOrderSubmit} className="space-y-8">
            {/* Step 1: Choose Duration */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9ff3f]">LANGKAH 1</p>
                  <h2 className="font-display text-2xl font-bold tracking-tight">Pilih Masa Berlaku / Durasi</h2>
                </div>
                <span className="text-xs text-white/50">Fleksibel & Hemat</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                {DURATION_OPTIONS.map((opt) => {
                  const isSelected = selectedDuration === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setSelectedDuration(opt.id)}
                      className={`relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all sm:p-4 ${
                        isSelected
                          ? "border-[#d9ff3f] bg-[#d9ff3f]/10 shadow-[0_0_20px_rgba(217,255,63,0.15)] ring-1 ring-[#d9ff3f]"
                          : "border-white/10 bg-[#1b1d19] hover:border-white/20 hover:bg-[#20231d]"
                      }`}
                    >
                      {opt.badge && (
                        <span
                          className={`mb-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            opt.id === "1_year"
                              ? "bg-[#d9ff3f] text-[#151810]"
                              : opt.id === "3_months" || opt.id === "6_months"
                              ? "bg-emerald-400/20 text-emerald-300"
                              : "bg-white/10 text-white/60"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      <div>
                        <p className={`font-display text-sm sm:text-base font-bold ${isSelected ? "text-[#d9ff3f]" : "text-white"}`}>
                          {opt.label}
                        </p>
                        {opt.discountPercentage > 0 ? (
                          <p className="mt-1 text-xs text-emerald-400 font-medium">Hemat {opt.discountPercentage}%</p>
                        ) : (
                          <p className="mt-1 text-xs text-white/40">{opt.isSingleVisit ? "1 Hari" : "Harga Dasar"}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Choose Tier */}
            <div>
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9ff3f]">LANGKAH 2</p>
                <h2 className="font-display text-2xl font-bold tracking-tight">Pilih Paket Membership</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {(["flex", "unlimited", "coach"] as PlanTier[]).map((tierKey) => {
                  const cfg = PLAN_CONFIGS[tierKey];
                  const isSelected = selectedTier === tierKey;
                  const tierCalc = calculateOrderPrice(tierKey, selectedDuration, appliedPromo);

                  return (
                    <button
                      type="button"
                      key={tierKey}
                      onClick={() => setSelectedTier(tierKey)}
                      className={`relative flex flex-col justify-between rounded-3xl border p-5 text-left transition-all ${
                        isSelected
                          ? "border-[#d9ff3f] bg-[#1d2019] shadow-xl ring-2 ring-[#d9ff3f]"
                          : "border-white/10 bg-[#161814] hover:border-white/20"
                      }`}
                    >
                      {tierKey === "unlimited" && (
                        <span className="absolute -top-3 right-5 rounded-full bg-[#d9ff3f] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#151810]">
                          Paling Diminati
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-display text-xl font-bold text-white">{cfg.name}</h3>
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                              isSelected ? "border-[#d9ff3f] bg-[#d9ff3f] text-[#151810]" : "border-white/20 text-transparent"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </div>
                        </div>
                        <p className="mt-1.5 text-xs text-white/50 leading-relaxed">{cfg.tagline}</p>

                        <div className="mt-5 border-t border-white/10 pt-4">
                          <div className="flex items-baseline gap-2">
                            <span className="font-display text-2xl sm:text-3xl font-bold text-[#d9ff3f]">
                              {formatRupiah(tierCalc.finalPrice)}
                            </span>
                          </div>
                          {tierCalc.totalSavings > 0 && (
                            <p className="mt-1 text-xs text-white/40 line-through">
                              {formatRupiah(tierCalc.basePrice)}
                            </p>
                          )}
                          {!selectedDuration.startsWith("single") && (
                            <p className="mt-1 text-[11px] font-medium text-emerald-400">
                              Setara {formatRupiah(tierCalc.monthlyEquivalent)}/bln
                            </p>
                          )}
                        </div>

                        <ul className="mt-5 space-y-2 text-xs text-white/70">
                          {cfg.features.map((feat) => (
                            <li key={feat} className="flex items-start gap-2">
                              <Check className="h-3.5 w-3.5 shrink-0 text-[#d9ff3f] mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Customer Details */}
            <div className="rounded-3xl border border-white/10 bg-[#161814] p-5 sm:p-7">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9ff3f]">LANGKAH 3</p>
                <h2 className="font-display text-2xl font-bold tracking-tight">Data Member & Pembayaran</h2>
                <p className="mt-1 text-xs text-white/50">Data ini digunakan untuk aktivasi kartu member gym digital Anda.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">Nama Lengkap</label>
                  <Input
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Raka Pratama"
                    className="h-11 rounded-xl border-white/15 bg-white/5 text-sm text-white placeholder:text-white/30 focus-visible:ring-[#d9ff3f]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">Nomor Telepon / WhatsApp</label>
                  <Input
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0812 3456 7890"
                    className="h-11 rounded-xl border-white/15 bg-white/5 text-sm text-white placeholder:text-white/30 focus-visible:ring-[#d9ff3f]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-white/70">Alamat Email</label>
                  <Input
                    required
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="h-11 rounded-xl border-white/15 bg-white/5 text-sm text-white placeholder:text-white/30 focus-visible:ring-[#d9ff3f]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-medium text-white/70">Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: "qris", label: "QRIS Instant", desc: "BCA, GoPay, OVO, Dana" },
                      { id: "bank_transfer", label: "Transfer Bank", desc: "Virtual Account BCA/Mandiri" },
                      { id: "cash", label: "Bayar di Kasir", desc: "Saat datang ke Ziu Gym" },
                    ].map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`rounded-2xl border p-3 text-left transition-all ${
                          paymentMethod === m.id
                            ? "border-[#d9ff3f] bg-[#d9ff3f]/10 text-white ring-1 ring-[#d9ff3f]"
                            : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                        }`}
                      >
                        <p className="font-semibold text-xs text-white">{m.label}</p>
                        <p className="mt-1 text-[10px] text-white/40">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-white/70">Catatan Khusus (Opsional)</label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Jadwal visit pertama jam 17:00, mohon siapkan loker"
                    className="h-11 rounded-xl border-white/15 bg-white/5 text-sm text-white placeholder:text-white/30 focus-visible:ring-[#d9ff3f]"
                  />
                </div>
              </div>
            </div>

            {/* Submit button on desktop */}
            <div className="hidden sm:block">
              <Button
                type="submit"
                disabled={orderMutation.isPending}
                size="lg"
                className="w-full rounded-full bg-[#d9ff3f] py-6 text-base font-bold text-[#151810] shadow-[0_0_25px_rgba(217,255,63,0.3)] hover:bg-[#edff94] transition-all"
              >
                {orderMutation.isPending ? "Memproses Pemesanan..." : `Pesan & Bayar Sekarang — ${formatRupiah(calculation.finalPrice)}`}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </form>

          {/* Right Column: Order Summary & Voucher */}
          <div className="space-y-6">
            <div className="sticky top-20 rounded-3xl border border-white/10 bg-[#161814] p-5 sm:p-7 shadow-xl">
              <h3 className="font-display text-xl font-bold">Ringkasan Pesanan</h3>
              <p className="mt-1 text-xs text-white/50">Detail kalkulasi sistematis dan penghematan Anda.</p>

              {/* Selected Plan Details */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-[#d9ff3f]">
                    Paket {calculation.tierName}
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white">
                    {calculation.durationLabel}
                  </span>
                </div>
                {!selectedDuration.startsWith("single") && (
                  <p className="mt-2 text-xs text-white/60">
                    Setara <strong className="text-white">{formatRupiah(calculation.monthlyEquivalent)}</strong> per bulan (hanya ~{formatRupiah(calculation.dailyEquivalent)}/hari!)
                  </p>
                )}
              </div>

              {/* Promo Code Input */}
              <div className="mt-5">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-white/75">
                  <Tag className="h-3.5 w-3.5 text-[#d9ff3f]" />
                  <span>Kupon / Kode Promo Diskon</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    placeholder="Masukkan voucher (ZIUFIRST)"
                    className="h-10 rounded-xl border-white/15 bg-white/5 text-xs uppercase text-white placeholder:text-white/30 focus-visible:ring-[#d9ff3f]"
                  />
                  <Button
                    type="button"
                    onClick={handleApplyPromo}
                    className="h-10 rounded-xl bg-white/10 px-4 text-xs font-medium text-white hover:bg-[#d9ff3f] hover:text-[#151810]"
                  >
                    Gunakan
                  </Button>
                </div>

                {/* Quick Promo Chips */}
                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
                  {["ZIUFIRST", "FIT2026", "STUDENT"].map((code) => (
                    <button
                      type="button"
                      key={code}
                      onClick={() => {
                        setPromoCodeInput(code);
                        setAppliedPromo(code);
                        toast.success(`Promo ${code} diterapkan!`);
                      }}
                      className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] transition-colors ${
                        appliedPromo === code
                          ? "border-[#d9ff3f] bg-[#d9ff3f]/20 text-[#d9ff3f]"
                          : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      +{code}
                    </button>
                  ))}
                </div>

                {calculation.promoDescription && (
                  <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{calculation.promoDescription}</span>
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="mt-6 space-y-2.5 border-t border-white/10 pt-5 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Harga Normal</span>
                  <span>{formatRupiah(calculation.basePrice)}</span>
                </div>

                {calculation.durationDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Diskon Paket ({selectedDuration.replace("_", " ")})</span>
                    <span>- {formatRupiah(calculation.durationDiscount)}</span>
                  </div>
                )}

                {calculation.promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Voucher ({calculation.promoCode})</span>
                    <span>- {formatRupiah(calculation.promoDiscount)}</span>
                  </div>
                )}

                <div className="border-t border-white/10 pt-3 flex items-baseline justify-between font-bold">
                  <span className="text-base text-white">Total Pembayaran</span>
                  <span className="font-display text-2xl text-[#d9ff3f]">
                    {formatRupiah(calculation.finalPrice)}
                  </span>
                </div>

                {calculation.totalSavings > 0 && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs font-semibold text-emerald-300">
                    🎉 Anda Berhasil Menghemat {formatRupiah(calculation.totalSavings)}!
                  </div>
                )}
              </div>

              {/* Trust badges */}
              <div className="mt-6 grid grid-cols-2 gap-2 text-[11px] text-white/50 border-t border-white/10 pt-4">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#d9ff3f]" />
                  <span>Akses Langsung Aktif</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BadgePercent className="h-4 w-4 text-[#d9ff3f]" />
                  <span>Garansi Terbaik</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Mobile Checkout Bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#161814]/95 backdrop-blur-xl p-3 sm:hidden shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase text-white/40 block leading-tight">Total Pembayaran</span>
            <span className="font-display text-xl font-bold text-[#d9ff3f]">
              {formatRupiah(calculation.finalPrice)}
            </span>
          </div>
          <Button
            onClick={handleOrderSubmit}
            disabled={orderMutation.isPending}
            className="flex-1 rounded-full bg-[#d9ff3f] text-[#151810] font-bold hover:bg-[#edff94] py-5"
          >
            {orderMutation.isPending ? "Memproses..." : "Konfirmasi & Bayar"}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Order Success Dialog */}
      <Dialog open={Boolean(successOrder)} onOpenChange={() => setSuccessOrder(null)}>
        <DialogContent className="border-white/10 bg-[#1d1f1b] text-white sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#d9ff3f]/20 text-[#d9ff3f] mb-2">
              <CheckCircle2 className="h-8 w-8 text-[#d9ff3f]" />
            </div>
            <DialogTitle className="font-display text-2xl text-center">
              Pemesanan Berhasil!
            </DialogTitle>
            <DialogDescription className="text-center text-white/60">
              Selamat datang di Ziu Gym! Membership Anda telah aktif secara otomatis.
            </DialogDescription>
          </DialogHeader>

          {successOrder && (
            <div className="my-3 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">No. Pesanan</span>
                <span className="font-mono font-bold text-[#d9ff3f]">{successOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Nama Member</span>
                <span className="font-medium text-white">{successOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Paket & Durasi</span>
                <span className="font-medium text-white uppercase">{successOrder.tier} ({successOrder.duration.replace("_", " ")})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Total Dibayar</span>
                <span className="font-bold text-[#d9ff3f]">{formatRupiah(successOrder.finalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Status</span>
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 font-bold text-emerald-300">
                  LUNAS / AKTIF
                </span>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-[#252822] p-3 text-center text-xs text-white/70 flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5 text-[#d9ff3f]" />
            <span>Kartu digital & QR Check-in siap digunakan di dashboard member.</span>
          </div>

          <DialogFooter className="mt-3 flex gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setSuccessOrder(null);
                setLocation("/");
              }}
              className="flex-1 rounded-full border-white/20 text-white"
            >
              Beranda
            </Button>
            <Button
              onClick={() => {
                setSuccessOrder(null);
                setLocation("/dashboard");
              }}
              className="flex-1 rounded-full bg-[#d9ff3f] text-[#151810] font-bold hover:bg-[#edff94]"
            >
              Buka Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
