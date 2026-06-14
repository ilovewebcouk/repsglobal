import { ChevronRight } from "lucide-react";

import { AdminCard } from "@/components/admin/AdminCard";
import { PanelHeader } from "@/components/admin/PanelHeader";
import { ViewAllLink } from "@/components/admin/ViewAllLink";
import { AdminStars } from "@/components/admin/AdminStars";

import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";

const TOP_PROS = [
  {
    rank: 1,
    name: "Sarah Mitchell",
    specialism: "Personal Trainer",
    rating: 4.9,
    reviews: 189,
    views: "2,845",
    leads: 156,
    conv: "21.3%",
    avatar: proLaura,
  },
  {
    rank: 2,
    name: "James Cooper",
    specialism: "Strength Coach",
    rating: 4.8,
    reviews: 142,
    views: "2,156",
    leads: 128,
    conv: "19.6%",
    avatar: proJames,
  },
  {
    rank: 3,
    name: "Emma Davis",
    specialism: "Pilates Instructor",
    rating: 4.8,
    reviews: 132,
    views: "1,987",
    leads: 112,
    conv: "18.7%",
    avatar: proSophie,
  },
  {
    rank: 4,
    name: "Michael Johnson",
    specialism: "Nutritionist",
    rating: 4.7,
    reviews: 98,
    views: "1,654",
    leads: 94,
    conv: "17.9%",
    avatar: proDaniel,
  },
  {
    rank: 5,
    name: "Hannah Scott",
    specialism: "Personal Trainer",
    rating: 4.7,
    reviews: 87,
    views: "1,432",
    leads: 81,
    conv: "16.8%",
    avatar: proLaura,
  },
];

export function TopProsTable() {
  return (
    <AdminCard size="panel">
      <PanelHeader title="Top Performing Professionals" right={<ViewAllLink />} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-white/45">
              <th className="w-12 pb-3 font-semibold">Rank</th>
              <th className="pb-3 font-semibold">Professional</th>
              <th className="pb-3 font-semibold">Specialism</th>
              <th className="pb-3 font-semibold">Rating</th>
              <th className="pb-3 font-semibold">Reviews</th>
              <th className="pb-3 font-semibold">Profile Views</th>
              <th className="pb-3 font-semibold">Leads</th>
              <th className="pb-3 font-semibold">Conversion Rate</th>
            </tr>
          </thead>
          <tbody>
            {TOP_PROS.map((p) => (
              <tr key={p.rank} className="border-t border-reps-border">
                <td className="py-3 font-display text-[14px] font-bold text-white/85">{p.rank}</td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                    <span className="font-semibold text-white">{p.name}</span>
                  </div>
                </td>
                <td className="py-3 text-white/75">{p.specialism}</td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="font-semibold text-white">{p.rating}</span>
                    <AdminStars value={p.rating} />
                  </span>
                </td>
                <td className="py-3 text-white/75">{p.reviews}</td>
                <td className="py-3 text-white/75">{p.views}</td>
                <td className="py-3 text-white/75">{p.leads}</td>
                <td className="py-3 font-semibold text-reps-green">{p.conv}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-center">
        <button type="button" className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline">
          View full leaderboard <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </AdminCard>
  );
}
