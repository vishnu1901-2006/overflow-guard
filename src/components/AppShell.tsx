import Link from "next/link";

export function AppShell({
  role,
  children,
}: {
  role: "admin" | "worker" | "resident" | "home";
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#10231a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#8fd16a] font-mono text-sm font-black text-[#10231a]">
              OG
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide text-white">
                OverflowGuard
              </span>
              <span className="block text-xs text-[#c9e4bf]">
                Smart garbage overflow control
              </span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            <NavLink href="/admin" active={role === "admin"}>
              Administrator
            </NavLink>
            <NavLink href="/worker" active={role === "worker"}>
              Workers
            </NavLink>
            <NavLink href="/resident" active={role === "resident"}>
              Society
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 transition ${
        active
          ? "bg-[#8fd16a] font-semibold text-[#10231a]"
          : "text-[#d7ead0] hover:bg-white/10"
      }`}
    >
      {children}
    </Link>
  );
}
