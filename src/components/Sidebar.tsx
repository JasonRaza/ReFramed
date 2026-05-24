"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Trophy, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_TOP = [
  { icon: LayoutGrid, href: "/",          label: "Accueil" },
  { icon: Trophy,     href: "/rankings",  label: "Classement" },
  { icon: User,       href: "/profile",   label: "Profil" },
];

const NAV_BOTTOM = [
  { icon: Settings, href: "/settings", label: "Paramètres" },
];

function NavIcon({
  icon: Icon,
  href,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  href: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative flex items-center">
      {/* Active indicator — vertical line on the left */}
      <span
        className={cn(
          "absolute -left-3 h-5 w-[2.5px] rounded-full bg-[#f6b73c] transition-all duration-200",
          active ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50",
        )}
      />

      <button
        onClick={onClick}
        aria-label={label}
        title={label}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150",
          active
            ? "bg-[#f6b73c]/10"
            : "hover:bg-[#1e1e1e] text-[#555] hover:text-[#888]",
        )}
      >
        <Icon
          size={19}
          className={cn(
            "transition-colors",
            active ? "text-[#f6b73c]" : "text-[#555]",
          )}
          strokeWidth={active ? 2.2 : 1.8}
        />
      </button>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[72px] flex-col items-center border-r border-[#1e1e1e] bg-[#0e0e0e] py-5 z-40">
        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="mb-7 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f6b73c]/10 border border-[#f6b73c]/20 transition-opacity hover:opacity-80"
          aria-label="Accueil"
        >
          <span className="text-xl leading-none">🎭</span>
        </button>

        {/* Top nav */}
        <nav className="flex flex-col items-center gap-1.5 flex-1">
          {NAV_TOP.map((item) => (
            <NavIcon
              key={item.href}
              icon={item.icon}
              href={item.href}
              label={item.label}
              active={isActive(item.href)}
              onClick={() => router.push(item.href)}
            />
          ))}
        </nav>

        {/* Bottom nav */}
        <nav className="flex flex-col items-center gap-1.5">
          {NAV_BOTTOM.map((item) => (
            <NavIcon
              key={item.href}
              icon={item.icon}
              href={item.href}
              label={item.label}
              active={isActive(item.href)}
              onClick={() => router.push(item.href)}
            />
          ))}
        </nav>
      </aside>

      {/* ── Mobile bottom tab bar ───────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-[#1e1e1e] bg-[#0e0e0e] px-4 py-2 pb-safe">
        {[...NAV_TOP, ...NAV_BOTTOM].map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              aria-label={item.label}
              className="relative flex flex-col items-center gap-1 px-3 py-1"
            >
              <item.icon
                size={22}
                className={cn("transition-colors", active ? "text-[#f6b73c]" : "text-[#555]")}
                strokeWidth={active ? 2.2 : 1.8}
              />
              {active && (
                <span className="absolute -bottom-1 h-[2px] w-4 rounded-full bg-[#f6b73c]" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
