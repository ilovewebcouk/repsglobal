import { createFileRoute } from "@tanstack/react-router";
import { User, Target, Dumbbell, Apple, Bell, Ruler } from "lucide-react";
import { ClientShell, PortalCard } from "@/components/portal/ClientShell";

export const Route = createFileRoute("/portal_/profile")({
  head: () => ({
    meta: [
      { title: "Profile — REPS Client Portal" },
      { name: "description", content: "Goals, training, nutrition preferences and notifications." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-reps-border py-2.5 last:border-0">
      <span className="text-[12.5px] text-white/55">{label}</span>
      <span className="text-[13px] font-medium text-white">{value}</span>
    </div>
  );
}

function Toggle({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-reps-border py-2.5 last:border-0">
      <span className="text-[12.5px] text-white/75">{label}</span>
      <span className={`flex h-5 w-9 items-center rounded-full p-0.5 ${on ? "bg-reps-orange" : "bg-white/10"}`}>
        <span className={`h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
      </span>
    </div>
  );
}

function ProfilePage() {
  return (
    <ClientShell active="Profile" title="Profile & settings" subtitle="Your goals, preferences and notifications">
      <div className="grid gap-5 lg:grid-cols-2">
        <PortalCard>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange"><User className="h-3.5 w-3.5" /></span>
            <span className="text-[13.5px] font-semibold text-white">About you</span>
          </div>
          <Row label="Name" value="Sarah Johnson" />
          <Row label="Coach" value="James Carter" />
          <Row label="Age" value="29" />
          <Row label="Height" value="168 cm" />
          <Row label="Current weight" value="68.4 kg" />
        </PortalCard>

        <PortalCard>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange"><Target className="h-3.5 w-3.5" /></span>
            <span className="text-[13.5px] font-semibold text-white">Goals</span>
          </div>
          <Row label="Primary goal" value="Body recomposition" />
          <Row label="Target weight" value="66 kg" />
          <Row label="Weekly sessions" value="4" />
          <Row label="Deadline" value="Sep 2026" />
        </PortalCard>

        <PortalCard>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange"><Dumbbell className="h-3.5 w-3.5" /></span>
            <span className="text-[13.5px] font-semibold text-white">Training</span>
          </div>
          <Row label="Experience" value="Intermediate · 3 yrs" />
          <Row label="Equipment" value="Full commercial gym" />
          <Row label="Preferred days" value="Mon · Wed · Fri · Sat" />
          <Row label="Injuries" value="Right hip — mobility focus" />
        </PortalCard>

        <PortalCard>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange"><Apple className="h-3.5 w-3.5" /></span>
            <span className="text-[13.5px] font-semibold text-white">Nutrition</span>
          </div>
          <Row label="Diet style" value="Flexible · high protein" />
          <Row label="Allergies" value="Tree nuts" />
          <Row label="Dislikes" value="Mushrooms, blue cheese" />
          <Row label="Daily target" value="2,150 kcal · 170P / 240C / 70F" />
        </PortalCard>

        <PortalCard>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange"><Ruler className="h-3.5 w-3.5" /></span>
            <span className="text-[13.5px] font-semibold text-white">Units</span>
          </div>
          <Row label="Weight" value="Kilograms" />
          <Row label="Height" value="Centimetres" />
          <Row label="Energy" value="kcal" />
          <Row label="Distance" value="Kilometres" />
        </PortalCard>

        <PortalCard>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange"><Bell className="h-3.5 w-3.5" /></span>
            <span className="text-[13.5px] font-semibold text-white">Notifications</span>
          </div>
          <Toggle label="Workout reminders" on={true} />
          <Toggle label="Meal log reminders" on={true} />
          <Toggle label="Weekly check-in reminder" on={true} />
          <Toggle label="Coach messages" on={true} />
          <Toggle label="Product updates & tips" on={false} />
        </PortalCard>
      </div>
    </ClientShell>
  );
}
