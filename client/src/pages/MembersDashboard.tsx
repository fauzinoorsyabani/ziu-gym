import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { formatRupiah, PLAN_CONFIGS } from "@shared/pricing";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CirclePause,
  Clock,
  CreditCard,
  Dumbbell,
  Medal,
  Pencil,
  Plus,
  QrCode,
  Receipt,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  UsersRound,
  Wallet,
  Zap,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ─── types ───────────────────────────────────────────────────────────────────
type UserRole = "user" | "member" | "admin" | "super_admin";

type MemberForm = {
  name: string;
  email: string;
  phone: string;
  plan: "flex" | "unlimited" | "coach";
  status: "active" | "paused" | "expired";
  joinedAt: string;
  expiresAt: string;
};

// ─── helpers ──────────────────────────────────────────────────────────────────
const planLabels = { flex: "Flex", unlimited: "Unlimited", coach: "Coach" };
const statusLabels = { active: "Aktif", paused: "Ditunda", expired: "Berakhir" };

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function toInputDate(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}

function emptyForm(): MemberForm {
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(today.getMonth() + 1);
  return {
    name: "",
    email: "",
    phone: "",
    plan: "flex",
    status: "active",
    joinedAt: toInputDate(today),
    expiresAt: toInputDate(nextMonth),
  };
}

function StatusBadge({ status }: { status: MemberForm["status"] }) {
  const className =
    status === "active"
      ? "border-[#d9ff3f]/30 bg-[#d9ff3f]/10 text-[#d9ff3f]"
      : status === "paused"
        ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
        : "border-white/15 bg-white/5 text-white/45";
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </Badge>
  );
}

// ─── sub-views ────────────────────────────────────────────────────────────────

/** Super Admin View: financials, order stats, members */
function SuperAdminView() {
  const membersQuery = trpc.members.list.useQuery();
  const membersStatsQuery = trpc.members.stats.useQuery();
  const orderStatsQuery = trpc.orders.stats.useQuery();
  const ordersQuery = trpc.orders.list.useQuery();

  const stats = membersStatsQuery.data;
  const orderStats = orderStatsQuery.data;
  const orders = ordersQuery.data ?? [];

  const metrics = [
    {
      label: "Total Pendapatan",
      value: orderStats ? formatRupiah(orderStats.totalRevenue) : "—",
      icon: Wallet,
      tone: "bg-[#d9ff3f] text-[#171916]",
      sub: `dari ${orderStats?.totalOrders ?? 0} order`,
    },
    {
      label: "Order Bulan Ini",
      value: orderStats?.totalOrders ?? "—",
      icon: TrendingUp,
      tone: "bg-emerald-300/12 text-emerald-200",
      sub: "semua status",
    },
    {
      label: "Member Aktif",
      value: stats?.active ?? "—",
      icon: Users,
      tone: "bg-blue-400/12 text-blue-200",
      sub: `dari ${stats?.total ?? 0} total`,
    },
    {
      label: "Perlu Ditinjau",
      value: stats?.expired ?? "—",
      icon: CalendarClock,
      tone: "bg-white/8 text-white/65",
      sub: "membership berakhir",
    },
  ];

  return (
    <div className="space-y-7">
      {/* Header */}
      <section className="border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#d9ff3f] text-[#151810]">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9ff3f]">
            Super Admin · ZIU GYM
          </p>
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">
          KONTROL PENUH.
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-white/50">
          Pantau keuangan, order masuk, dan seluruh operasional Ziu Gym dari satu ruang kendali.
        </p>
      </section>

      {/* KPI Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, tone, sub }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-[#1d1f1b] p-5 hover:border-white/20 transition-colors"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="font-display mt-5 text-3xl font-semibold tracking-[-0.055em]">
              {value}
            </p>
            <p className="mt-1 text-sm font-medium text-white/80">{label}</p>
            {sub && <p className="mt-0.5 text-xs text-white/35">{sub}</p>}
          </div>
        ))}
      </section>

      {/* Recent Orders */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#1b1d19]">
        <div className="flex flex-col gap-2 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-[-0.04em]">
              Order Terbaru
            </h2>
            <p className="mt-1 text-sm text-white/45">
              {ordersQuery.isLoading ? "Memuat..." : `${orders.length} order total`}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9ff3f]/25 bg-[#d9ff3f]/8 px-3 py-1 text-xs font-medium text-[#d9ff3f]">
            <Activity className="h-3 w-3" />
            Live data
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="bg-white/[0.025] text-xs uppercase tracking-[0.13em] text-white/35">
              <tr>
                <th className="px-5 py-4 font-medium">Order</th>
                <th className="px-4 py-4 font-medium">Paket</th>
                <th className="px-4 py-4 font-medium">Total</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {ordersQuery.isLoading ? (
                <tr>
                  <td className="px-5 py-9 text-white/45" colSpan={5}>
                    Memuat data...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td className="px-5 py-12 text-center text-white/45" colSpan={5}>
                    Belum ada order masuk.
                  </td>
                </tr>
              ) : (
                orders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.025] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white/90 font-mono text-xs">
                        {order.orderNumber}
                      </p>
                      <p className="mt-1 text-xs text-white/40">{order.customerName}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium text-white/75 capitalize">{order.tier}</span>
                      <span className="mt-0.5 block text-xs text-white/40 capitalize">
                        {order.duration.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-[#d9ff3f]">
                      {formatRupiah(order.finalPrice)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          order.status === "paid"
                            ? "bg-emerald-400/15 text-emerald-300"
                            : order.status === "pending"
                              ? "bg-amber-400/15 text-amber-300"
                              : order.status === "completed"
                                ? "bg-blue-400/15 text-blue-300"
                                : "bg-white/10 text-white/40"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white/50 text-xs">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/** Admin View: member management */
function AdminView() {
  const utils = trpc.useUtils();
  const membersQuery = trpc.members.list.useQuery();
  const statsQuery = trpc.members.stats.useQuery();
  const [query, setQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);

  const createMutation = trpc.members.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.members.list.invalidate(),
        utils.members.stats.invalidate(),
      ]);
      toast.success("Member berhasil ditambahkan");
      setIsDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.members.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.members.list.invalidate(),
        utils.members.stats.invalidate(),
      ]);
      toast.success("Data member diperbarui");
      setIsDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });
  const statusMutation = trpc.members.updateStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.members.list.invalidate(),
        utils.members.stats.invalidate(),
      ]);
      toast.success("Status diperbarui");
    },
    onError: (e) => toast.error(e.message),
  });

  const members = membersQuery.data ?? [];
  const filteredMembers = useMemo(
    () =>
      members.filter((m) =>
        [m.name, m.email, m.phone, m.plan].some((v) =>
          v.toLowerCase().includes(query.trim().toLowerCase())
        )
      ),
    [members, query]
  );
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openNewMember = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsDialogOpen(true);
  };
  const openEditMember = (member: (typeof members)[number]) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      plan: member.plan,
      status: member.status,
      joinedAt: toInputDate(member.joinedAt),
      expiresAt: toInputDate(member.expiresAt),
    });
    setIsDialogOpen(true);
  };
  const saveMember = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      ...form,
      joinedAt: new Date(`${form.joinedAt}T12:00:00`),
      expiresAt: new Date(`${form.expiresAt}T12:00:00`),
    };
    if (editingId) updateMutation.mutate({ ...payload, id: editingId });
    else createMutation.mutate(payload);
  };

  const metrics = [
    {
      label: "Total member",
      value: statsQuery.data?.total ?? 0,
      icon: UsersRound,
      tone: "bg-[#d9ff3f] text-[#171916]",
    },
    {
      label: "Membership aktif",
      value: statsQuery.data?.active ?? 0,
      icon: CheckCircle2,
      tone: "bg-emerald-300/12 text-emerald-200",
    },
    {
      label: "Ditunda",
      value: statsQuery.data?.paused ?? 0,
      icon: CirclePause,
      tone: "bg-amber-300/12 text-amber-200",
    },
    {
      label: "Perlu ditinjau",
      value: statsQuery.data?.expired ?? 0,
      icon: CalendarClock,
      tone: "bg-white/8 text-white/65",
    },
  ];

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-400/15 text-blue-300">
              <Users className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
              Admin · ZIU / OPERATIONS
            </p>
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">
            MEMBER, TERATUR.
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/50">
            Pantau siklus membership dan kelola data member dari satu ruang kerja.
          </p>
        </div>
        <Button
          onClick={openNewMember}
          className="rounded-full bg-[#d9ff3f] px-5 text-[#151810] hover:bg-[#edff94] shrink-0"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Tambah member
        </Button>
      </section>

      {membersQuery.error || statsQuery.error ? (
        <div className="rounded-2xl border border-red-300/25 bg-red-300/10 p-5 text-sm text-red-100">
          Akses dashboard hanya tersedia untuk administrator. Coba masuk ulang.
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon, tone }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-[#1d1f1b] p-5 hover:border-white/20 transition-colors"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="font-display mt-6 text-3xl font-semibold tracking-[-0.055em]">
                  {statsQuery.isLoading ? "—" : value}
                </p>
                <p className="mt-1 text-sm text-white/45">{label}</p>
              </div>
            ))}
          </section>

          <section
            id="members"
            className="overflow-hidden rounded-2xl border border-white/10 bg-[#1b1d19]"
          >
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-[-0.04em]">
                  Daftar member
                </h2>
                <p className="mt-1 text-sm text-white/45">
                  {membersQuery.isLoading
                    ? "Memuat data member..."
                    : `${filteredMembers.length} member ditampilkan`}
                </p>
              </div>
              <label className="relative block sm:w-70">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama atau kontak"
                  className="h-10 rounded-full border-white/10 bg-white/5 pl-10 text-sm placeholder:text-white/30 focus-visible:ring-[#d9ff3f]"
                />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 text-left text-sm">
                <thead className="bg-white/[0.025] text-xs uppercase tracking-[0.13em] text-white/35">
                  <tr>
                    <th className="px-5 py-4 font-medium">Member</th>
                    <th className="px-4 py-4 font-medium">Paket</th>
                    <th className="px-4 py-4 font-medium">Status</th>
                    <th className="px-4 py-4 font-medium">Berakhir</th>
                    <th className="px-4 py-4 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {membersQuery.isLoading ? (
                    <tr>
                      <td className="px-5 py-9 text-white/45" colSpan={5}>
                        Memuat data...
                      </td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td
                        className="px-5 py-13 text-center text-white/45"
                        colSpan={5}
                      >
                        {query
                          ? "Tidak ada member yang sesuai pencarian."
                          : "Belum ada member. Tambahkan data member pertama."}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="transition-colors hover:bg-white/[0.025]"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-white/90">{member.name}</p>
                          <p className="mt-1 text-xs text-white/40">
                            {member.email} · {member.phone}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-medium text-white/75">
                            {planLabels[member.plan]}
                          </span>
                          <span className="mt-1 block text-xs text-white/40">
                            Mulai {formatDate(member.joinedAt)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            aria-label={`Ubah status ${member.name}`}
                            value={member.status}
                            disabled={statusMutation.isPending}
                            onChange={(e) =>
                              statusMutation.mutate({
                                id: member.id,
                                status: e.target.value as MemberForm["status"],
                              })
                            }
                            className="rounded-full border-0 bg-transparent p-0 text-xs font-medium text-white focus:outline-none focus:ring-0"
                          >
                            <option value="active" className="bg-[#242620]">
                              Aktif
                            </option>
                            <option value="paused" className="bg-[#242620]">
                              Ditunda
                            </option>
                            <option value="expired" className="bg-[#242620]">
                              Berakhir
                            </option>
                          </select>
                          <div className="mt-1.5">
                            <StatusBadge status={member.status} />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-white/65">
                          {formatDate(member.expiresAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            onClick={() => openEditMember(member)}
                            variant="outline"
                            size="sm"
                            className="rounded-full border-white/12 bg-transparent text-white/70 hover:bg-white hover:text-[#151810]"
                          >
                            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#20221e] text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-[-0.045em]">
              {editingId ? "Edit member" : "Tambah member baru"}
            </DialogTitle>
            <DialogDescription className="text-white/45">
              Simpan detail dasar membership agar tim Ziu dapat memantau statusnya.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveMember} className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama lengkap">
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nama member"
                  className="field-input"
                />
              </Field>
              <Field label="Nomor telepon">
                <Input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="08xx xxxx xxxx"
                  className="field-input"
                />
              </Field>
            </div>
            <Field label="Email">
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@email.com"
                className="field-input"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Paket">
                <select
                  value={form.plan}
                  onChange={(e) =>
                    setForm({ ...form, plan: e.target.value as MemberForm["plan"] })
                  }
                  className="field-select"
                >
                  <option value="flex">Flex</option>
                  <option value="unlimited">Unlimited</option>
                  <option value="coach">Coach</option>
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as MemberForm["status"] })
                  }
                  className="field-select"
                >
                  <option value="active">Aktif</option>
                  <option value="paused">Ditunda</option>
                  <option value="expired">Berakhir</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tanggal bergabung">
                <Input
                  required
                  type="date"
                  value={form.joinedAt}
                  onChange={(e) => setForm({ ...form, joinedAt: e.target.value })}
                  className="field-input"
                />
              </Field>
              <Field label="Tanggal berakhir">
                <Input
                  required
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="field-input"
                />
              </Field>
            </div>
            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-full border-white/15 bg-transparent text-white/70 hover:bg-white/8 hover:text-white"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-[#d9ff3f] text-[#151810] hover:bg-[#edff94]"
              >
                {isSaving
                  ? "Menyimpan..."
                  : editingId
                    ? "Simpan perubahan"
                    : "Tambah member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Member View: digital membership card + quick order */
function MemberView() {
  const [, setLocation] = useLocation();
  const myOrdersQuery = trpc.orders.myOrders.useQuery({});

  const latestOrder = myOrdersQuery.data?.[0];
  const hasActiveOrder = latestOrder?.status === "paid" || latestOrder?.status === "completed";

  const planIcons = {
    flex: <Zap className="h-5 w-5" />,
    unlimited: <Sparkles className="h-5 w-5" />,
    coach: <Medal className="h-5 w-5" />,
  };

  // Expiry computation (mock: 1 month / 3 months / etc from order creation)
  const getExpiry = (order: typeof latestOrder) => {
    if (!order) return null;
    const base = new Date(order.createdAt);
    const monthsMap: Record<string, number> = {
      single_visit: 0,
      "1_month": 1,
      "3_months": 3,
      "6_months": 6,
      "1_year": 12,
    };
    base.setMonth(base.getMonth() + (monthsMap[order.duration] ?? 1));
    return base;
  };

  const expiry = latestOrder ? getExpiry(latestOrder) : null;
  const daysLeft = expiry
    ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 86_400_000))
    : null;

  const tierConfig = latestOrder && PLAN_CONFIGS[latestOrder.tier as keyof typeof PLAN_CONFIGS];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <section className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
            <BadgeCheck className="h-3.5 w-3.5" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Member · ZIU GYM
          </p>
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">
          SELAMAT DATANG.
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/50">
          Ini ruang member kamu. Lihat kartu digital membership dan beli paket baru.
        </p>
      </section>

      {/* Digital Membership Card */}
      {hasActiveOrder && latestOrder ? (
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
            Kartu Digital Kamu
          </h2>
          {/* Card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#1e2b1a] via-[#1d2119] to-[#0f1610] p-6 shadow-2xl sm:p-8">
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#d9ff3f]/8 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-8 left-8 h-28 w-28 rounded-full bg-emerald-400/8 blur-2xl" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d9ff3f] text-[#151810]">
                    <Dumbbell className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                    Ziu Gym · Membership Card
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      tierConfig
                        ? "bg-[#d9ff3f]/15 text-[#d9ff3f]"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {latestOrder.tier && planIcons[latestOrder.tier as keyof typeof planIcons]}
                    <span className="capitalize">{latestOrder.tier}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="font-display text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                  {latestOrder.customerName}
                </p>
                <p className="mt-1 text-sm text-white/40">{latestOrder.customerEmail}</p>
              </div>

              <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    Order No.
                  </p>
                  <p className="mt-1 font-mono text-sm font-medium text-white/70">
                    {latestOrder.orderNumber}
                  </p>
                </div>
                {expiry && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                      Berakhir
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/70">
                      {formatDate(expiry)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    Sisa waktu
                  </p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      (daysLeft ?? 0) <= 7
                        ? "text-amber-300"
                        : "text-[#d9ff3f]"
                    }`}
                  >
                    {daysLeft} hari
                  </p>
                </div>
              </div>

              {/* QR placeholder */}
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <QrCode className="h-6 w-6 text-white/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">QR Check-in</p>
                  <p className="text-xs text-white/40">
                    Tunjukkan kode ini kepada petugas saat masuk
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* No active membership */
        <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/8">
            <CreditCard className="h-6 w-6 text-white/40" />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
            Belum ada membership aktif
          </h3>
          <p className="mt-2 text-sm text-white/45">
            Pilih paket dan mulai perjalanan fitness kamu sekarang.
          </p>
        </section>
      )}

      {/* Quick actions */}
      <section className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => setLocation("/order")}
          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#1d1f1b] p-5 text-left hover:border-[#d9ff3f]/30 hover:bg-[#1d1f1b] transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d9ff3f] text-[#151810] group-hover:scale-110 transition-transform">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white/90">Beli / Perpanjang</p>
            <p className="text-xs text-white/40 mt-0.5">Paket baru dengan harga terbaik</p>
          </div>
          <ArrowRight className="h-4 w-4 text-white/25 group-hover:text-[#d9ff3f] transition-colors" />
        </button>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#1d1f1b] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/8">
            <BarChart3 className="h-5 w-5 text-white/50" />
          </div>
          <div>
            <p className="font-semibold text-white/70">Riwayat Order</p>
            <p className="text-xs text-white/35 mt-0.5">
              {myOrdersQuery.data?.length ?? 0} order sebelumnya
            </p>
          </div>
        </div>
      </section>

      {/* Order history list */}
      {(myOrdersQuery.data?.length ?? 0) > 0 && (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#1b1d19]">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="font-display text-lg font-semibold tracking-[-0.035em]">
              Riwayat Order
            </h2>
          </div>
          <div className="divide-y divide-white/8">
            {myOrdersQuery.data?.map((order) => (
              <div key={order.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/8">
                  <Receipt className="h-4 w-4 text-white/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white/85 capitalize">
                    {order.tier} · {order.duration.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5 font-mono">{order.orderNumber}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-[#d9ff3f]">
                    {formatRupiah(order.finalPrice)}
                  </p>
                  <span
                    className={`text-[11px] font-medium ${
                      order.status === "paid"
                        ? "text-emerald-300"
                        : "text-white/40"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** User (unauthenticated / guest) View */
function GuestView() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d9ff3f] text-[#151810]">
        <Dumbbell className="h-8 w-8" strokeWidth={2} />
      </div>
      <div className="max-w-sm">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.055em]">
          BERGABUNG DENGAN ZIU.
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/50">
          Kamu belum memiliki akses member. Beli membership untuk memulai perjalanan fitness kamu.
        </p>
      </div>
      <Button
        onClick={() => setLocation("/order")}
        className="rounded-full bg-[#d9ff3f] px-8 text-[#151810] hover:bg-[#edff94]"
        size="lg"
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Lihat Paket Membership
      </Button>
    </div>
  );
}

// ─── main export ──────────────────────────────────────────────────────────────
export default function MembersDashboard() {
  const [, setLocation] = useLocation();
  const simulatedRole = (localStorage.getItem("ziu-sim-role") as UserRole) || "super_admin";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        {/* Back to landing */}
        <button
          onClick={() => setLocation("/")}
          className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-white/40 transition-colors hover:text-[#d9ff3f]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke landing page
        </button>

        {simulatedRole === "super_admin" && <SuperAdminView />}
        {simulatedRole === "admin" && <AdminView />}
        {simulatedRole === "member" && <MemberView />}
        {simulatedRole === "user" && <GuestView />}
      </div>
    </DashboardLayout>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-white/75">
      <span>{label}</span>
      {children}
    </label>
  );
}
