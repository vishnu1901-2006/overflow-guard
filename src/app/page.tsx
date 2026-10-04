import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function Home() {
  return (
    <AppShell role="home">
      <section className="overflow-hidden rounded-[2rem] border border-[#cfe0c8] bg-[linear-gradient(160deg,#12261c_0%,#1f4330_48%,#8fd16a_160%)] px-6 py-12 text-white sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d4f0c6]">
          Built for societies, not just one bin
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          When a garbage bin is completely full, the administrator knows — and workers go empty it.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#dcead6] sm:text-base">
          OverflowGuard tracks uniquely identified bins across a society. IoT fill
          readings (and resident reports) push a live message the moment any of the
          20 bins in an area hits 100%. The admin dispatches a free worker to take
          the garbage and reset that bin.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <RoleCard
          href="/admin"
          title="Administrator"
          body="Watch live fill levels, receive full-bin messages, and send workers to the exact ID."
        />
        <RoleCard
          href="/worker"
          title="Collection worker"
          body="See the assigned bin ID, go empty it, and mark the garbage taken so the alert closes."
        />
        <RoleCard
          href="/resident"
          title="Society resident"
          body="Look up any of the 20 unique bin IDs in your area and report overflow in one tap."
        />
      </section>

      <section className="mt-8 grid gap-4 rounded-[2rem] bg-white p-6 shadow-sm sm:grid-cols-3">
        <Promise
          title="Unique bin IDs"
          body="Every bin is addressable in O(1) time — BIN-GM-01 through BIN-GM-20, plus more societies."
        />
        <Promise
          title="Push, not refresh"
          body="Live server events notify every connected admin the instant a bin becomes completely full."
        />
        <Promise
          title="Ready for many users"
          body="Indexed lookups, society filters, and a shared event bus keep dashboards light under load."
        />
      </section>
    </AppShell>
  );
}

function RoleCard({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-[#d7e6d2] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <h2 className="text-xl font-semibold text-[#12261c]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#4b6456]">{body}</p>
      <p className="mt-4 text-sm font-semibold text-[#1f6b4a]">Open desk →</p>
    </Link>
  );
}

function Promise({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-semibold text-[#12261c]">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-[#4b6456]">{body}</p>
    </div>
  );
}
