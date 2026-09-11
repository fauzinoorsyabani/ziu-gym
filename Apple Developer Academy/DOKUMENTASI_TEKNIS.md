# DOKUMENTASI TEKNIS — ZIU GYM
> Panduan memahami setiap baris kode project Ziu Gym
> Ditulis untuk membantu kamu membaca, mengubah, dan menjelaskan kode ini

---

## 1. STRUKTUR PROJECT (GAMBARAN BESAR)

```
ziu-gym/
├── client/              ← Frontend React (yang user lihat di browser)
│   ├── index.html       ← Entry point HTML
│   ├── public/          ← Asset statis (gambar, favicon)
│   └── src/
│       ├── App.tsx          ← Root component + routing
│       ├── index.css        ← Global CSS, design tokens, animasi
│       ├── const.ts         ← Konstanta client (URL login, dll)
│       ├── main.tsx         ← Entry point React (mount ke DOM)
│       ├── pages/           ← Halaman-halaman aplikasi
│       │   ├── Home.tsx         ← Landing page publik
│       │   └── MembersDashboard.tsx ← Dashboard admin
│       ├── components/      ← Komponen reusable
│       │   ├── DashboardLayout.tsx  ← Shell layout dashboard
│       │   ├── ui/              ← Komponen UI primitif (shadcn)
│       │   └── ...
│       ├── contexts/        ← React context providers
│       ├── hooks/           ← Custom React hooks
│       └── lib/
│           └── trpc.ts      ← tRPC client setup
│
├── server/              ← Backend Node.js (API + auth + database)
│   ├── _core/           ← Core infrastructure server
│   │   ├── index.ts         ← Entry point server (Express setup)
│   │   ├── trpc.ts          ← tRPC instance + middleware
│   │   ├── context.ts       ← Request context (user, req, res)
│   │   ├── cookies.ts       ← Cookie utilities
│   │   ├── env.ts           ← Environment variables
│   │   └── oauth.ts         ← OAuth flow handler
│   ├── routers.ts       ← SEMUA API routes (tRPC procedures)
│   ├── db.ts            ← Database queries (CRUD operations)
│   ├── members.test.ts  ← Unit tests untuk member procedures
│   └── storage.ts       ← File storage utilities
│
├── shared/              ← Kode yang dipakai client DAN server
│   ├── const.ts         ← Cookie names, error messages, dll
│   └── _core/
│       └── errors.ts    ← Error types bersama
│
└── drizzle/             ← Database schema & migrations
    ├── schema.ts        ← Definisi tabel database
    └── *.sql            ← Migration files (auto-generated)
```

**Konsep utama**: Client dan server adalah dua program terpisah yang berkomunikasi lewat tRPC over HTTP. `shared/` adalah "bahasa bersama" mereka.

---

## 2. DATABASE — DRIZZLE SCHEMA

### File: `drizzle/schema.ts`

**Tabel `users`** — Menyimpan data user yang sudah login:
```typescript
id          // Auto-increment primary key
openId      // ID dari OAuth provider (Manus) — unique per user
name        // Nama user
email       // Email user
loginMethod // Cara login (contoh: "manus")
role        // "user" atau "admin" — menentukan akses dashboard
createdAt   // Kapan akun dibuat
updatedAt   // Kapan terakhir diupdate (otomatis)
lastSignedIn // Kapan terakhir login
```

**Tabel `members`** — Menyimpan data member gym:
```typescript
id        // Auto-increment primary key
name      // Nama lengkap member
email     // Email member — UNIQUE (tidak boleh duplikat)
phone     // Nomor telepon
plan      // Pilihan: "flex" | "unlimited" | "coach"
status    // Pilihan: "active" | "paused" | "expired"
joinedAt  // Tanggal bergabung
expiresAt // Tanggal membership berakhir (HARUS >= joinedAt)
createdAt // Kapan record dibuat
updatedAt // Kapan terakhir diubah
```

**Kenapa desain ini?**
- Email unique mencegah member terdaftar dua kali
- Status 3-state (bukan boolean) karena member bisa "ditunda" sementara
- expiresAt penting untuk follow-up operasional

---

## 3. DATABASE QUERIES — server/db.ts

File ini berisi semua fungsi yang berinteraksi dengan database:

```typescript
getDb()
// Membuat koneksi database secara lazy (hanya saat diperlukan)
// Kalau DATABASE_URL tidak ada di env, return null (bukan error)
// Ini membuat development lokal bisa jalan tanpa database

upsertUser(user)
// Insert user baru, atau update kalau sudah ada (berdasarkan openId)
// Dipakai saat user login untuk pertama kali atau login ulang
// Kalau openId cocok dengan ENV.ownerOpenId, otomatis dapat role "admin"

getUserByOpenId(openId)
// Cari user berdasarkan openId OAuth
// Dipakai saat server memvalidasi session cookie

listMembers()
// Return semua member, diurutkan dari yang terbaru (DESC by createdAt)

createMember(member)
// Insert member baru ke database
// Akan error kalau database tidak tersedia

updateMember(id, member)
// Update semua field member berdasarkan id

updateMemberStatus(id, status)
// Update HANYA field status — lebih efisien dari updateMember lengkap
```

---

## 4. API ROUTES — server/routers.ts

File ini mendefinisikan SEMUA endpoint API menggunakan tRPC:

### Validasi Input Member
```typescript
memberInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(320),
  phone: z.string().min(8).max(32),
  plan: z.enum(["flex", "unlimited", "coach"]),
  status: z.enum(["active", "paused", "expired"]),
  joinedAt: z.coerce.date(),  // String "2026-01-01" diubah jadi Date object
  expiresAt: z.coerce.date(),
}).refine(
  (member) => member.expiresAt >= member.joinedAt,
  { message: "Tanggal akhir harus setelah tanggal bergabung" }
)
// .refine() adalah custom validation — bisa akses multiple fields sekaligus
```

### Routes yang tersedia:

**`auth.me`** — publicProcedure (siapa saja bisa akses)
- Return data user yang sedang login, atau null

**`auth.logout`** — publicProcedure
- Hapus session cookie → user logout

**`members.list`** — adminProcedure (hanya admin)
- Return array semua member dari database

**`members.stats`** — adminProcedure
- Return: `{ total, active, paused, expired }`
- Dihitung dari listMembers() dengan .reduce()

**`members.create`** — adminProcedure + input validation
- Buat member baru setelah validasi Zod

**`members.update`** — adminProcedure + input validation  
- Update member yang ada (perlu tambah field `id`)

**`members.updateStatus`** — adminProcedure
- Hanya update field status saja

**Apa bedanya publicProcedure vs adminProcedure?**
- `publicProcedure`: Siapa saja bisa akses, bahkan yang belum login
- `adminProcedure`: Cek `ctx.user.role === "admin"`, kalau bukan throw FORBIDDEN

---

## 5. AUTH FLOW (CARA LOGIN BEKERJA)

```
1. User klik "Masuk dashboard" di landing page
   → client/src/const.ts → startLogin() dipanggil
   → Redirect ke /api/auth/start

2. Server (server/_core/oauth.ts) handle /api/auth/start
   → Generate random nonce (angka random untuk keamanan CSRF)
   → Set cookie __Host-oauth_state berisi { redirectUri, nonce }
   → Redirect user ke URL login OAuth provider (Manus)

3. User login di Manus
   → Manus redirect balik ke /api/auth/callback?code=xxx&state=xxx

4. Server handle /api/auth/callback
   → Validasi state cookie cocok (CSRF check)
   → Tukar authorization code dengan access token
   → Ambil data user dari OAuth provider
   → upsertUser() — simpan/update user di database
   → Buat JWT token berisi user ID
   → Set session cookie app_session_id = JWT token
   → Redirect ke /dashboard

5. Setiap request selanjutnya:
   → Server baca cookie app_session_id
   → Decrypt + verify JWT
   → Ambil user dari database
   → Taruh di ctx.user
   → adminProcedure cek ctx.user.role
```

**Kenapa pakai cookie, bukan localStorage?**
- Cookie dengan HttpOnly flag tidak bisa diakses JavaScript → lebih aman dari XSS
- `__Host-` prefix memaksa cookie Secure + Path=/ + no Domain → CSRF protection

---

## 6. FRONTEND — App.tsx & ROUTING

```typescript
// client/src/App.tsx
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={MembersDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />  // Fallback
    </Switch>
  );
}
```

Routing menggunakan **Wouter** — alternatif React Router yang lebih ringan.
Route `/dashboard` tidak ada guard di sini, tapi `MembersDashboard` membutuhkan
auth melalui tRPC query yang akan gagal kalau bukan admin.

---

## 7. LANDING PAGE — client/src/pages/Home.tsx

### Data Statis
```typescript
programs = [
  { number: "01", title: "Strength", detail: "..." },
  { number: "02", title: "Conditioning", detail: "..." },
  { number: "03", title: "Mobility", detail: "..." },
]

heroPhrases = [
  { lead: "BUILD", middle: "YOUR", accent: "BEST." },
  { lead: "FIND", middle: "YOUR", accent: "POWER." },
  { lead: "TRAIN", middle: "WITH", accent: "PURPOSE." },
  { lead: "SHOW", middle: "UP", accent: "AGAIN." },
]

// Trick animasi loop: duplikat elemen pertama di akhir array
// Sehingga saat animasi balik ke awal, transisi mulus
loopingHeroPhrases = [...heroPhrases, heroPhrases[0]]
```

### State Management
```typescript
const [menuOpen, setMenuOpen] = useState(false)
// Kontrol mobile hamburger menu

const [reducedMotion, setReducedMotion] = useState(() =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
)
// Baca preferensi reduced-motion dari OS user
// Kalau user aktifkan "Reduce Motion" di OS, animasi dimatikan
```

### Struktur Halaman
1. `<header>` — Navbar fixed top (logo + nav links + CTA button)
2. `<section>` Hero — Animated phrase + gym equipment visual
3. `<section>` Marquee — "Strength · Focus · Discipline · Repeat" scrolling
4. `<section id="program">` — 3 program cards (Strength, Conditioning, Mobility)
5. `<section id="mengapa-ziu">` — Benefits section
6. `<section id="membership">` — 3 membership tiers (Flex, Unlimited, Coach)
7. `<section>` CTA — "Buka dashboard" call-to-action
8. `<footer>` — Minimal footer

---

## 8. DASHBOARD — client/src/pages/MembersDashboard.tsx

### Data Fetching dengan tRPC
```typescript
const membersQuery = trpc.members.list.useQuery()
// Fetch daftar member → auto-retry, loading state, error state

const statsQuery = trpc.members.stats.useQuery()
// Fetch { total, active, paused, expired }

const createMutation = trpc.members.create.useMutation({
  onSuccess: async () => {
    await utils.members.list.invalidate()  // Refresh list
    await utils.members.stats.invalidate() // Refresh stats
    toast.success("Member berhasil ditambahkan")
    setIsDialogOpen(false)
  }
})
```

### Search Filtering
```typescript
const filteredMembers = useMemo(() =>
  members.filter((member) =>
    [member.name, member.email, member.phone, member.plan]
      .some((value) => value.toLowerCase().includes(query.trim().toLowerCase()))
  ),
  [members, query]
)
// useMemo mencegah recalculation setiap render — hanya hitung ulang saat members atau query berubah
// Filter mencari di 4 field sekaligus: nama, email, telepon, paket
```

### Dialog Form (Add/Edit)
```typescript
const [editingId, setEditingId] = useState<number | null>(null)
// null = mode tambah baru
// number = mode edit member yang ada

const openEditMember = (member) => {
  setEditingId(member.id)  // Set ID yang sedang diedit
  setForm({ ...member fields... })  // Pre-fill form dengan data member
  setIsDialogOpen(true)
}

const saveMember = (event) => {
  event.preventDefault()
  if (editingId) {
    updateMutation.mutate({ ...payload, id: editingId })  // Update
  } else {
    createMutation.mutate(payload)  // Create baru
  }
}
// Satu form, dua mode — lebih efisien dari dua komponen terpisah
```

---

## 9. CSS ANIMATION SYSTEM — client/src/index.css

### Hero Phrase Loop
```css
/* Container dengan overflow hidden — hanya 1 phrase terlihat */
.hero-phrase-viewport {
  height: 2.52em;     /* Tinggi satu phrase */
  overflow: hidden;   /* Sembunyikan phrase lain */
}

/* Track yang bergerak naik */
.hero-phrase-track {
  animation: ziu-phrase-loop 13.2s cubic-bezier(0.77, 0, 0.175, 1) infinite;
}

/* Setiap phrase punya tinggi sama dengan viewport */
.hero-phrase {
  height: 2.52em;
  display: block;
}

/* Keyframes: pause setiap 16% dari durasi, lalu lompat */
@keyframes ziu-phrase-loop {
  0%, 16%  { transform: translateY(0);    }  /* Phrase 1 */
  25%, 41% { transform: translateY(-20%); }  /* Phrase 2 */
  50%, 66% { transform: translateY(-40%); }  /* Phrase 3 */
  75%, 91% { transform: translateY(-60%); }  /* Phrase 4 */
  100%     { transform: translateY(-80%); }  /* Phrase 1 lagi (duplikat) */
}
/* Di 100%, track sudah di duplikat phrase pertama → infinite seamless */
```

### Marquee Animation
```css
.marquee-track {
  animation: ziu-marquee 18s linear infinite;
  width: max-content;  /* Panjang content asli */
}

@keyframes ziu-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }  /* -50% karena content diduplikat */
}
/* Array marqueeWords diduplikat: [...marqueeWords, ...marqueeWords] */
/* Saat animate sampai -50%, sudah di tengah → seamless loop */
```

### Reduced Motion Support
```css
/* User dengan vestibular disorder bisa matikan animasi di OS */
@media (prefers-reduced-motion: no-preference) {
  /* Animasi hanya aktif kalau user TIDAK minta reduced motion */
  .hero-phrase-track { animation: ... }
  .marquee-track { animation: ... }
}

/* Fallback statis ketika reduced motion aktif */
.motion-reduced .marquee-track {
  width: 100%;
  white-space: normal;  /* Wrap ke baris berikutnya */
  text-align: center;
  animation: none !important;
}
```

---

## 10. UNIT TESTS — server/members.test.ts

### Setup Mock
```typescript
vi.mock("./db", () => ({
  createMember: vi.fn(),
  listMembers: vi.fn(),
  updateMember: vi.fn(),
  updateMemberStatus: vi.fn(),
}))
// Mock database functions → test TIDAK butuh koneksi database nyata
// vi.fn() = fungsi palsu yang bisa dicek apakah sudah dipanggil
```

### Helper Functions
```typescript
function createMemberInput() {
  return {
    name: "Raka Pratama",
    email: "raka@example.com",
    phone: "081234567890",
    plan: "flex",
    status: "active",
    joinedAt: new Date("2026-08-01T12:00:00.000Z"),
    expiresAt: new Date("2026-09-01T12:00:00.000Z"),
  }
}
// Data fixture — dipakai ulang di semua test

function createContext(role: "admin" | "user"): TrpcContext {
  return {
    user: { id: ..., role, ... },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  }
}
// Simulasi context request dengan role berbeda
```

### Test Cases
```typescript
// Test 1: Validasi schema
it("accepts a valid member record", () => {
  const parsed = memberInputSchema.parse({ ...input })
  expect(parsed.name).toBe("Raka Pratama")
  expect(parsed.joinedAt).toBeInstanceOf(Date)  // string diconvert ke Date
})

// Test 2: Validasi constraint tanggal
it("rejects an expiry date before the joined date", () => {
  const input = { ...validInput, expiresAt: new Date("2026-07-31") }  // SEBELUM joinedAt
  expect(() => memberInputSchema.parse(input)).toThrow("Tanggal akhir harus setelah tanggal bergabung")
})

// Test 3-4: Admin berhasil
it("allows an administrator to create a member", async () => {
  const caller = appRouter.createCaller(createContext("admin"))  // Login sebagai admin
  await expect(caller.members.create(input)).resolves.toEqual({ success: true })
  expect(createMember).toHaveBeenCalledWith(input)  // Pastikan DB dipanggil
})

// Test 5: Non-admin ditolak
it("rejects all member mutations from a non-admin user", async () => {
  const caller = appRouter.createCaller(createContext("user"))  // Login sebagai user biasa
  await expect(caller.members.create(input)).rejects.toMatchObject({ code: "FORBIDDEN" })
})
```

---

## 11. CARA MENJALANKAN PROJECT

### Development
```bash
# Install dependencies (gunakan npm dengan legacy peer deps karena pnpm mungkin tidak tersedia)
npm install --legacy-peer-deps

# Jalankan server development (perlu DATABASE_URL di .env untuk fitur member)
# Windows PowerShell:
$env:NODE_ENV='development'; node_modules\.bin\tsx watch server/_core/index.ts

# Jalankan Vite dev server (frontend) di terminal terpisah:
node_modules\.bin\vite

# Atau keduanya sekaligus (hanya Linux/Mac):
npm run dev
```

### Environment Variables (buat file `.env` di root)
```
DATABASE_URL=mysql://user:password@host:3306/database
OWNER_OPEN_ID=openid-kamu  # Ini yang akan dapat role admin otomatis
JWT_SECRET=random-secret-string
```

### Testing
```bash
npm test
# atau
node_modules\.bin\vitest run
```

---

## 12. CARA MENGUBAH KODE

### Menambah field baru ke member
1. Edit `drizzle/schema.ts` — tambah kolom baru
2. Jalankan `npm run db:push` — generate dan apply migration
3. Edit `server/routers.ts` — tambah field ke `memberInputSchema`
4. Edit `server/db.ts` — update query kalau perlu
5. Edit `client/src/pages/MembersDashboard.tsx` — tambah field ke form dan tabel

### Menambah halaman baru
1. Buat file baru di `client/src/pages/NamaHalaman.tsx`
2. Import dan tambah `<Route path="/path-baru" component={NamaHalaman} />` di `App.tsx`

### Mengubah warna tema
Warna utama ada di `client/src/index.css`:
- `#101111` — background gelap utama
- `#d9ff3f` — accent lime
- `#f6f6ef` — teks terang

Dan di komponen langsung menggunakan Tailwind arbitrary values: `bg-[#101111]`

### Mengubah kecepatan animasi
- Hero phrase loop: ubah `13.2s` di `.hero-phrase-track { animation: ziu-phrase-loop 13.2s... }`
- Marquee: ubah `18s` di `.marquee-track { animation: ziu-marquee 18s... }`
- Equipment float: ubah `6s` di `.equipment-float { animation: ziu-equipment-float 6s... }`
