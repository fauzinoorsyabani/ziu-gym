import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CalendarClock, CheckCircle2, CirclePause, Pencil, Plus, Search, UsersRound } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type MemberForm = {
  name: string;
  email: string;
  phone: string;
  plan: "flex" | "unlimited" | "coach";
  status: "active" | "paused" | "expired";
  joinedAt: string;
  expiresAt: string;
};

const planLabels = { flex: "Flex", unlimited: "Unlimited", coach: "Coach" };
const statusLabels = { active: "Aktif", paused: "Ditunda", expired: "Berakhir" };

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}

function toInputDate(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}

function emptyForm(): MemberForm {
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(today.getMonth() + 1);
  return { name: "", email: "", phone: "", plan: "flex", status: "active", joinedAt: toInputDate(today), expiresAt: toInputDate(nextMonth) };
}

function StatusBadge({ status }: { status: MemberForm["status"] }) {
  const className = status === "active" ? "border-[#d9ff3f]/30 bg-[#d9ff3f]/10 text-[#d9ff3f]" : status === "paused" ? "border-amber-300/25 bg-amber-300/10 text-amber-200" : "border-white/15 bg-white/5 text-white/45";
  return <Badge variant="outline" className={`gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${className}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{statusLabels[status]}</Badge>;
}

export default function MembersDashboard() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const membersQuery = trpc.members.list.useQuery();
  const statsQuery = trpc.members.stats.useQuery();
  const [query, setQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);

  const createMutation = trpc.members.create.useMutation({
    onSuccess: async () => { await Promise.all([utils.members.list.invalidate(), utils.members.stats.invalidate()]); toast.success("Member berhasil ditambahkan"); setIsDialogOpen(false); },
    onError: (error) => toast.error(error.message),
  });
  const updateMutation = trpc.members.update.useMutation({
    onSuccess: async () => { await Promise.all([utils.members.list.invalidate(), utils.members.stats.invalidate()]); toast.success("Data member diperbarui"); setIsDialogOpen(false); },
    onError: (error) => toast.error(error.message),
  });
  const statusMutation = trpc.members.updateStatus.useMutation({
    onSuccess: async () => { await Promise.all([utils.members.list.invalidate(), utils.members.stats.invalidate()]); toast.success("Status membership diperbarui"); },
    onError: (error) => toast.error(error.message),
  });

  const members = membersQuery.data ?? [];
  const filteredMembers = useMemo(() => members.filter((member) => [member.name, member.email, member.phone, member.plan].some((value) => value.toLowerCase().includes(query.trim().toLowerCase()))), [members, query]);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openNewMember = () => { setEditingId(null); setForm(emptyForm()); setIsDialogOpen(true); };
  const openEditMember = (member: typeof members[number]) => { setEditingId(member.id); setForm({ name: member.name, email: member.email, phone: member.phone, plan: member.plan, status: member.status, joinedAt: toInputDate(member.joinedAt), expiresAt: toInputDate(member.expiresAt) }); setIsDialogOpen(true); };
  const saveMember = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const payload = { ...form, joinedAt: new Date(`${form.joinedAt}T12:00:00`), expiresAt: new Date(`${form.expiresAt}T12:00:00`) }; if (editingId) updateMutation.mutate({ ...payload, id: editingId }); else createMutation.mutate(payload); };

  const metrics = [
    { label: "Total member", value: statsQuery.data?.total ?? 0, icon: UsersRound, tone: "bg-[#d9ff3f] text-[#171916]" },
    { label: "Membership aktif", value: statsQuery.data?.active ?? 0, icon: CheckCircle2, tone: "bg-emerald-300/12 text-emerald-200" },
    { label: "Ditunda", value: statsQuery.data?.paused ?? 0, icon: CirclePause, tone: "bg-amber-300/12 text-amber-200" },
    { label: "Perlu ditinjau", value: statsQuery.data?.expired ?? 0, icon: CalendarClock, tone: "bg-white/8 text-white/65" },
  ];

  return <DashboardLayout>
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
        <div><button onClick={() => setLocation("/")} className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-white/45 transition-colors hover:text-[#d9ff3f]"><ArrowLeft className="h-3.5 w-3.5" /> Kembali ke landing page</button><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9ff3f]">ZIU / OPERATIONS</p><h1 className="font-display mt-2 text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">MEMBER, TERATUR.</h1><p className="mt-3 max-w-lg text-sm leading-6 text-white/50">Pantau siklus membership dan kelola data member dari satu ruang kerja yang tenang.</p></div>
        <Button onClick={openNewMember} className="rounded-full bg-[#d9ff3f] px-5 text-[#151810] hover:bg-[#edff94]"><Plus className="mr-1.5 h-4 w-4" /> Tambah member</Button>
      </section>

      {membersQuery.error || statsQuery.error ? <div className="rounded-2xl border border-red-300/25 bg-red-300/10 p-5 text-sm text-red-100">Akses dashboard ini hanya tersedia untuk administrator Ziu Gym. Jika Anda adalah pemilik, masuk kembali untuk menyegarkan akses.</div> : <>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-white/10 bg-[#1d1f1b] p-5"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></div><p className="font-display mt-6 text-3xl font-semibold tracking-[-0.055em]">{statsQuery.isLoading ? "—" : value}</p><p className="mt-1 text-sm text-white/45">{label}</p></div>)}</section>
        <section id="members" className="overflow-hidden rounded-2xl border border-white/10 bg-[#1b1d19]"><div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-xl font-semibold tracking-[-0.04em]">Daftar member</h2><p className="mt-1 text-sm text-white/45">{membersQuery.isLoading ? "Memuat data member..." : `${filteredMembers.length} member ditampilkan`}</p></div><label className="relative block sm:w-70"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau kontak" className="h-10 rounded-full border-white/10 bg-white/5 pl-10 text-sm placeholder:text-white/30 focus-visible:ring-[#d9ff3f]" /></label></div>
          <div className="overflow-x-auto"><table className="w-full min-w-190 text-left text-sm"><thead className="bg-white/[0.025] text-xs uppercase tracking-[0.13em] text-white/35"><tr><th className="px-5 py-4 font-medium">Member</th><th className="px-4 py-4 font-medium">Paket</th><th className="px-4 py-4 font-medium">Status</th><th className="px-4 py-4 font-medium">Berakhir</th><th className="px-4 py-4 text-right font-medium">Aksi</th></tr></thead><tbody className="divide-y divide-white/8">{membersQuery.isLoading ? <tr><td className="px-5 py-9 text-white/45" colSpan={5}>Memuat data...</td></tr> : filteredMembers.length === 0 ? <tr><td className="px-5 py-13 text-center text-white/45" colSpan={5}>{query ? "Tidak ada member yang sesuai pencarian." : "Belum ada member. Tambahkan data member pertama."}</td></tr> : filteredMembers.map((member) => <tr key={member.id} className="transition-colors hover:bg-white/[0.025]"><td className="px-5 py-4"><p className="font-medium text-white/90">{member.name}</p><p className="mt-1 text-xs text-white/40">{member.email} · {member.phone}</p></td><td className="px-4 py-4"><span className="font-medium text-white/75">{planLabels[member.plan]}</span><span className="mt-1 block text-xs text-white/40">Mulai {formatDate(member.joinedAt)}</span></td><td className="px-4 py-4"><select aria-label={`Ubah status ${member.name}`} value={member.status} disabled={statusMutation.isPending} onChange={(event) => statusMutation.mutate({ id: member.id, status: event.target.value as MemberForm["status"] })} className="rounded-full border-0 bg-transparent p-0 text-xs font-medium text-white focus:outline-none focus:ring-0"><option value="active" className="bg-[#242620]">Aktif</option><option value="paused" className="bg-[#242620]">Ditunda</option><option value="expired" className="bg-[#242620]">Berakhir</option></select><div className="mt-1.5"><StatusBadge status={member.status} /></div></td><td className="px-4 py-4 text-white/65">{formatDate(member.expiresAt)}</td><td className="px-5 py-4 text-right"><Button onClick={() => openEditMember(member)} variant="outline" size="sm" className="rounded-full border-white/12 bg-transparent text-white/70 hover:bg-white hover:text-[#151810]"><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit</Button></td></tr>)}</tbody></table></div>
        </section>
      </>}
    </div>
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#20221e] text-white sm:max-w-xl"><DialogHeader><DialogTitle className="font-display text-2xl tracking-[-0.045em]">{editingId ? "Edit member" : "Tambah member baru"}</DialogTitle><DialogDescription className="text-white/45">Simpan detail dasar membership agar tim Ziu dapat memantau statusnya.</DialogDescription></DialogHeader><form onSubmit={saveMember} className="grid gap-4 py-2"><div className="grid gap-4 sm:grid-cols-2"><Field label="Nama lengkap"><Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nama member" className="field-input" /></Field><Field label="Nomor telepon"><Input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="08xx xxxx xxxx" className="field-input" /></Field></div><Field label="Email"><Input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="nama@email.com" className="field-input" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Paket"><select value={form.plan} onChange={(event) => setForm({ ...form, plan: event.target.value as MemberForm["plan"] })} className="field-select"><option value="flex">Flex</option><option value="unlimited">Unlimited</option><option value="coach">Coach</option></select></Field><Field label="Status"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as MemberForm["status"] })} className="field-select"><option value="active">Aktif</option><option value="paused">Ditunda</option><option value="expired">Berakhir</option></select></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Tanggal bergabung"><Input required type="date" value={form.joinedAt} onChange={(event) => setForm({ ...form, joinedAt: event.target.value })} className="field-input" /></Field><Field label="Tanggal berakhir"><Input required type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} className="field-input" /></Field></div><DialogFooter className="mt-2"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-full border-white/15 bg-transparent text-white/70 hover:bg-white/8 hover:text-white">Batal</Button><Button type="submit" disabled={isSaving} className="rounded-full bg-[#d9ff3f] text-[#151810] hover:bg-[#edff94]">{isSaving ? "Menyimpan..." : editingId ? "Simpan perubahan" : "Tambah member"}</Button></DialogFooter></form></DialogContent></Dialog>
  </DashboardLayout>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-medium text-white/75"><span>{label}</span>{children}</label>;
}
