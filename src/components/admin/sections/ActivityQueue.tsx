import { FileText, GraduationCap, ShieldCheck, Star, UserCheck, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AdminCard } from "@/components/admin/AdminCard";
import { PanelHeader } from "@/components/admin/PanelHeader";
import { ViewAllLink } from "@/components/admin/ViewAllLink";
import { AdminStars } from "@/components/admin/AdminStars";

import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";

type ActivityItem = {
  icon: LucideIcon;
  title: string;
  sub: string;
  time: string;
  tag?: string;
  avatar?: string;
};

const RECENT: ActivityItem[] = [
  { icon: UserPlus, title: "Sophie Williams", sub: "New professional registration", time: "2m ago", tag: "NEW", avatar: proSophie },
  { icon: FileText, title: "Daniel Roberts", sub: "Profile updated", time: "15m ago", avatar: proDaniel },
  { icon: GraduationCap, title: "Mike Johnson", sub: "CPD certificate uploaded", time: "1h ago" },
  { icon: UserCheck, title: "Emma Davis", sub: "Member verified", time: "2h ago" },
  { icon: Star, title: "Tom Harris", sub: "New review received", time: "3h ago" },
];

type VerifyItem = { name: string; role: string; submitted: string; avatar: string };
const VERIFY: VerifyItem[] = [
  { name: "Alex Thompson", role: "Personal Trainer", submitted: "Submitted 1h ago", avatar: proJames },
  { name: "Olivia Parker", role: "Pilates Instructor", submitted: "Submitted 3h ago", avatar: proLaura },
  { name: "James Cooper", role: "Strength Coach", submitted: "Submitted 5h ago", avatar: proDaniel },
  { name: "Chloe Martin", role: "Nutritionist", submitted: "Submitted 6h ago", avatar: proSophie },
];

type ReviewItem = { name: string; role: string; rating: number; avatar: string };
const REVIEWS: ReviewItem[] = [
  { name: "Laura Mitchell", role: "Personal Trainer", rating: 4.9, avatar: proLaura },
  { name: "Ryan Foster", role: "Strength Coach", rating: 4.8, avatar: proJames },
  { name: "Hannah Scott", role: "Pilates Instructor", rating: 4.7, avatar: proSophie },
  { name: "Adam Lee", role: "Nutritionist", rating: 4.9, avatar: proDaniel },
];

const SYSTEM = [
  { label: "Website", sub: "All systems operational" },
  { label: "Professional Directory", sub: "All systems operational" },
  { label: "Payment Gateway", sub: "All systems operational" },
  { label: "Email Service", sub: "All systems operational" },
  { label: "Document Storage", sub: "All systems operational" },
];

export function ActivityQueue() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {/* Recent Activity */}
      <AdminCard>
        <PanelHeader title="Recent Activity" right={<ViewAllLink />} />
        <ul className="space-y-3">
          {RECENT.map((r) => (
            <li key={r.title} className="flex items-center gap-3">
              {r.avatar ? (
                <img src={r.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-reps-panel-soft text-white/60">
                  <r.icon className="h-4 w-4" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-semibold text-white">{r.title}</span>
                  {r.tag ? (
                    <span className="inline-flex h-4 items-center rounded-[6px] bg-reps-green/20 px-1.5 text-[9px] font-bold uppercase tracking-wider text-reps-green">
                      {r.tag}
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-[11px] text-white/55">{r.sub}</div>
              </div>
              <span className="text-[11px] text-white/45">{r.time}</span>
            </li>
          ))}
        </ul>
      </AdminCard>

      {/* Verification Queue */}
      <AdminCard>
        <PanelHeader
          title="Verification Queue"
          right={
            <div className="flex items-center gap-2">
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-reps-orange px-1.5 text-[10px] font-semibold text-white">23</span>
              <ViewAllLink />
            </div>
          }
        />
        <ul className="space-y-3">
          {VERIFY.map((v) => (
            <li key={v.name} className="flex items-center gap-3">
              <img src={v.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-white">{v.name}</div>
                <div className="truncate text-[11px] text-white/55">{v.role}</div>
                <div className="truncate text-[10px] text-white/40">{v.submitted}</div>
              </div>
              <span className="inline-flex h-6 items-center rounded-full bg-reps-orange-soft px-2.5 text-[10px] font-semibold text-reps-orange">Pending</span>
            </li>
          ))}
        </ul>
      </AdminCard>

      {/* Reviews Pending */}
      <AdminCard>
        <PanelHeader
          title="Reviews Pending"
          right={
            <div className="flex items-center gap-2">
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-reps-orange px-1.5 text-[10px] font-semibold text-white">18</span>
              <ViewAllLink />
            </div>
          }
        />
        <ul className="space-y-3">
          {REVIEWS.map((r) => (
            <li key={r.name} className="flex items-center gap-3">
              <img src={r.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-white">{r.name}</div>
                <div className="truncate text-[11px] text-white/55">{r.role}</div>
              </div>
              <div className="flex items-center gap-1">
                <AdminStars value={r.rating} />
                <span className="text-[11px] font-semibold text-white/70">{r.rating}</span>
              </div>
            </li>
          ))}
        </ul>
      </AdminCard>

      {/* System Status */}
      <AdminCard>
        <PanelHeader title="System Status" right={<ViewAllLink />} />
        <ul className="space-y-3">
          {SYSTEM.map((s) => (
            <li key={s.label} className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-reps-green/15 text-reps-green">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-white">{s.label}</div>
                <div className="truncate text-[11px] text-white/55">{s.sub}</div>
              </div>
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}
