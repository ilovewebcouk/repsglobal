import { useEffect, useState } from "react";
import { Brain, ClipboardCheck, Eye, Globe, Settings2, TrendingUp } from "lucide-react";

const PILLARS = [
  { id: "visibility", label: "Visibility", icon: Eye },
  { id: "shop-front", label: "Shop-front", icon: Globe },
  { id: "operations", label: "Operations", icon: Settings2 },
  { id: "coaching", label: "Coaching", icon: ClipboardCheck },
  { id: "ai", label: "REPs AI", icon: Brain },
  { id: "growth", label: "Growth", icon: TrendingUp },
];

export function PillarSubnav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string>("visibility");

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 720 && window.scrollY < document.body.scrollHeight - 1400);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = PILLARS.map((p) => document.getElementById(p.id)).filter(
      (el): el is HTMLElement => !!el,
    );
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visibleEntries[0]) setActive(visibleEntries[0].target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 top-[60px] z-30 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0 pointer-events-none"
      }`}
    >
      <div className="mx-auto max-w-[1320px] px-3 lg:px-10">
        <nav className="overflow-x-auto rounded-full border border-reps-border bg-reps-ink/85 px-2 py-2 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]">
          <ul className="flex items-center gap-1 whitespace-nowrap">
            {PILLARS.map((p) => {
              const isActive = active === p.id;
              return (
                <li key={p.id}>
                  <a
                    href={`#${p.id}`}
                    className={
                      isActive
                        ? "inline-flex items-center gap-1.5 rounded-full bg-reps-orange px-3 py-1.5 text-[12px] font-semibold text-white"
                        : "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-white/65 hover:bg-reps-panel/60 hover:text-white"
                    }
                  >
                    <p.icon className="h-3.5 w-3.5" />
                    {p.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
