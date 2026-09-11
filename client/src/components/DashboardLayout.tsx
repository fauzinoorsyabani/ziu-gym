import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  ChevronDown,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

type UserRole = "user" | "member" | "admin" | "super_admin";

const ROLE_LABELS: Record<UserRole, string> = {
  user: "User Biasa",
  member: "Member Gym",
  admin: "Admin",
  super_admin: "Super Admin",
};

const ROLE_COLORS: Record<UserRole, string> = {
  user: "bg-white/10 text-white/60",
  member: "bg-emerald-400/15 text-emerald-300",
  admin: "bg-blue-400/15 text-blue-300",
  super_admin: "bg-[#d9ff3f]/15 text-[#d9ff3f]",
};

function getMenuItems(role: UserRole) {
  switch (role) {
    case "super_admin":
      return [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        { icon: Receipt, label: "Semua Order", path: "/dashboard" },
        { icon: Users, label: "Kelola Member", path: "/dashboard" },
        { icon: Settings, label: "Pengaturan", path: "/dashboard" },
      ];
    case "admin":
      return [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        { icon: Users, label: "Kelola Member", path: "/dashboard" },
        { icon: Receipt, label: "Order Masuk", path: "/dashboard" },
      ];
    case "member":
      return [
        { icon: CreditCard, label: "Kartu Digital", path: "/dashboard" },
        { icon: ShoppingCart, label: "Order Membership", path: "/order" },
      ];
    default:
      return [
        { icon: ShoppingCart, label: "Beli Membership", path: "/order" },
      ];
  }
}

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101111] p-5 text-white">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#1d1f1b] p-7 text-center shadow-2xl sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d9ff3f] text-[#151810]">
            <Dumbbell className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="mt-7 flex flex-col items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9ff3f]">
              ZIU / OPERATIONS
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.055em]">
              MASUK KE RUANG KERJA.
            </h1>
            <p className="max-w-sm text-sm leading-6 text-white/50">
              Dashboard ini menyimpan data operasional member Ziu Gym dan hanya
              tersedia untuk tim yang berwenang.
            </p>
          </div>
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="mt-8 w-full rounded-full bg-[#d9ff3f] text-[#151810] hover:bg-[#edff94]"
          >
            Masuk dengan akun tim
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Role simulation state
  const [simulatedRole, setSimulatedRole] = useState<UserRole>(() => {
    return (localStorage.getItem("ziu-sim-role") as UserRole) || "super_admin";
  });
  const switchRoleMutation = trpc.auth.switchRole.useMutation({
    onSuccess: (data) => {
      setSimulatedRole(data.activeRole as UserRole);
      localStorage.setItem("ziu-sim-role", data.activeRole);
      toast.success(`Mode: ${ROLE_LABELS[data.activeRole as UserRole]}`);
    },
    onError: () => toast.error("Gagal mengganti role"),
  });

  const handleSwitchRole = (role: UserRole) => {
    switchRoleMutation.mutate({ role });
  };

  const menuItems = getMenuItems(simulatedRole);
  const activeMenuItem = menuItems.find((item) => item.path === location);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-display font-semibold tracking-tight truncate">
                    ZIU GYM
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          {/* Role Switcher — Dev tool, visible when expanded */}
          {!isCollapsed && (
            <div className="px-3 pb-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/8 transition-colors focus:outline-none">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#d9ff3f] shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 leading-none mb-0.5">
                        Mode Demo
                      </p>
                      <p className="text-xs font-medium text-white/80 truncate">
                        {ROLE_LABELS[simulatedRole]}
                      </p>
                    </div>
                    <ChevronDown className="h-3 w-3 text-white/35 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 border-white/10 bg-[#1e2020]">
                  <DropdownMenuLabel className="text-xs text-white/40 uppercase tracking-widest">
                    Ganti Peran
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/8" />
                  {(["super_admin", "admin", "member", "user"] as UserRole[]).map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => handleSwitchRole(role)}
                      className={`cursor-pointer text-white/80 focus:text-white focus:bg-white/8 ${simulatedRole === role ? "opacity-100" : "opacity-60"}`}
                    >
                      <span
                        className={`mr-2 inline-block h-2 w-2 rounded-full ${
                          role === "super_admin" ? "bg-[#d9ff3f]" :
                          role === "admin" ? "bg-blue-400" :
                          role === "member" ? "bg-emerald-400" : "bg-white/30"
                        }`}
                      />
                      {ROLE_LABELS[role]}
                      {simulatedRole === role && <span className="ml-auto text-[#d9ff3f]">✓</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 transition-all font-normal"
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            {/* Role badge — collapsed mode */}
            {isCollapsed && (
              <div
                className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg text-[9px] font-bold mx-auto ${ROLE_COLORS[simulatedRole]}`}
                title={ROLE_LABELS[simulatedRole]}
              >
                {simulatedRole === "super_admin" ? "SA" :
                 simulatedRole === "admin" ? "AD" :
                 simulatedRole === "member" ? "MB" : "US"}
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 border-white/10 bg-[#1e2020]">
                <DropdownMenuLabel className="text-xs text-white/40">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/8" />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-red-400/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "ZIU GYM"}
                  </span>
                </div>
              </div>
            </div>
            {/* Mobile role badge */}
            <span className={`mr-3 rounded-full px-2.5 py-1 text-[10px] font-semibold ${ROLE_COLORS[simulatedRole]}`}>
              {ROLE_LABELS[simulatedRole]}
            </span>
          </div>
        )}
        <main className="flex-1 p-4 sm:p-6">
          {/* Pass role down via context or prop drilling */}
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
