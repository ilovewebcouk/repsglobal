import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export function StickyCtaPill({ threshold = 680 }: { threshold?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <Link
        to="/pricing"
        className="inline-flex h-12 items-center gap-2 rounded-full bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
      >
        See pricing <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
