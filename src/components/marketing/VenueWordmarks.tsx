/**
 * Real gym wordmarks rendered as inline SVG. Each source SVG is imported as
 * raw text, normalised at module load (all baked fills, gradients and inline
 * styles replaced with `currentColor`, width/height stripped), and injected
 * via dangerouslySetInnerHTML so the parent text color tints every mark
 * uniformly. Same mechanism as PressWordmarks.
 *
 * The user has confirmed permission to display these marks. The parent
 * VenueStrip ships the legal hygiene line ("not affiliated with the gyms shown").
 */

import type * as React from "react";

import puregymRaw from "@/assets/venues/puregym.svg?raw";
import gymGroupRaw from "@/assets/venues/the_gym_group.svg?raw";
import virginActiveRaw from "@/assets/venues/virgin_active.svg?raw";
import davidLloydRaw from "@/assets/venues/david_lloyd.svg?raw";
import nuffieldHealthRaw from "@/assets/venues/nuffield_health.svg?raw";
import thirdSpaceRaw from "@/assets/venues/third_space.svg?raw";
import anytimeFitnessRaw from "@/assets/venues/anytime_fitness.svg?raw";
import fitnessFirstRaw from "@/assets/venues/fitness_first.svg?raw";
import everyoneActiveRaw from "@/assets/venues/everyone_active.svg?raw";
import energieFitnessRaw from "@/assets/venues/energie_fitness.svg?raw";
import bannatyneRaw from "@/assets/venues/bannatyne.svg?raw";

type WordmarkProps = { className?: string };

type Normalised = { viewBox: string; inner: string };

function normalise(raw: string): Normalised {
  const viewBoxMatch = raw.match(/viewBox="([^"]+)"/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 100 32";

  const openTagEnd = raw.indexOf(">", raw.indexOf("<svg"));
  const closeTagStart = raw.lastIndexOf("</svg>");
  let inner = raw.slice(openTagEnd + 1, closeTagStart);

  inner = inner.replace(/<style[\s\S]*?<\/style>/gi, "");
  inner = inner.replace(/<linearGradient[\s\S]*?<\/linearGradient>/gi, "");
  inner = inner.replace(/<radialGradient[\s\S]*?<\/radialGradient>/gi, "");
  inner = inner.replace(/fill="url\(#[^)]*\)"/gi, 'fill="currentColor"');
  inner = inner.replace(/stroke="url\(#[^)]*\)"/gi, 'stroke="currentColor"');
  inner = inner.replace(/fill="#[0-9a-f]{3,8}"/gi, 'fill="currentColor"');
  inner = inner.replace(/stroke="#[0-9a-f]{3,8}"/gi, 'stroke="currentColor"');
  inner = inner.replace(/fill="rgba?\([^)]+\)"/gi, 'fill="currentColor"');
  inner = inner.replace(/fill\s*:\s*[^;"']+;?/gi, "fill:currentColor;");
  inner = inner.replace(/var\(--[a-z0-9-]+(?:,[^)]*)?\)/gi, "currentColor");

  return { viewBox, inner };
}

const PUREGYM = normalise(puregymRaw);
const GYM_GROUP = normalise(gymGroupRaw);
const VIRGIN_ACTIVE = normalise(virginActiveRaw);
const DAVID_LLOYD = normalise(davidLloydRaw);
const NUFFIELD = normalise(nuffieldHealthRaw);
const THIRD_SPACE = normalise(thirdSpaceRaw);
const ANYTIME = normalise(anytimeFitnessRaw);
const FITNESS_FIRST = normalise(fitnessFirstRaw);
const EVERYONE = normalise(everyoneActiveRaw);
const ENERGIE = normalise(energieFitnessRaw);
const BANNATYNE = normalise(bannatyneRaw);

function InlineMark({
  data,
  label,
  className,
}: {
  data: Normalised;
  label: string;
  className?: string;
}) {
  return (
    <svg
      viewBox={data.viewBox}
      className={className}
      role="img"
      aria-label={label}
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      dangerouslySetInnerHTML={{ __html: data.inner }}
    />
  );
}

export function PureGymMark({ className }: WordmarkProps) {
  return <InlineMark data={PUREGYM} label="PureGym" className={className} />;
}
export function GymGroupMark({ className }: WordmarkProps) {
  return <InlineMark data={GYM_GROUP} label="The Gym Group" className={className} />;
}
export function VirginActiveMark({ className }: WordmarkProps) {
  return <InlineMark data={VIRGIN_ACTIVE} label="Virgin Active" className={className} />;
}
export function DavidLloydMark({ className }: WordmarkProps) {
  return <InlineMark data={DAVID_LLOYD} label="David Lloyd" className={className} />;
}
export function NuffieldHealthMark({ className }: WordmarkProps) {
  return <InlineMark data={NUFFIELD} label="Nuffield Health" className={className} />;
}
export function ThirdSpaceMark({ className }: WordmarkProps) {
  return <InlineMark data={THIRD_SPACE} label="Third Space" className={className} />;
}
export function AnytimeFitnessMark({ className }: WordmarkProps) {
  return <InlineMark data={ANYTIME} label="Anytime Fitness" className={className} />;
}
export function FitnessFirstMark({ className }: WordmarkProps) {
  return <InlineMark data={FITNESS_FIRST} label="Fitness First" className={className} />;
}
export function EveryoneActiveMark({ className }: WordmarkProps) {
  return <InlineMark data={EVERYONE} label="Everyone Active" className={className} />;
}
export function EnergieFitnessMark({ className }: WordmarkProps) {
  return <InlineMark data={ENERGIE} label="énergie Fitness" className={className} />;
}
export function BannatyneMark({ className }: WordmarkProps) {
  return <InlineMark data={BANNATYNE} label="Bannatyne" className={className} />;
}

export type VenueEntry = {
  key: string;
  slug: string;
  label: string;
  Mark: (props: WordmarkProps) => React.ReactElement;
  widthClass: string;
};

export const VENUES: VenueEntry[] = [
  { key: "puregym", slug: "puregym", label: "PureGym", Mark: PureGymMark, widthClass: "w-[124px]" },
  { key: "gym-group", slug: "gym-group", label: "The Gym Group", Mark: GymGroupMark, widthClass: "w-[160px]" },
  { key: "virgin-active", slug: "virgin-active", label: "Virgin Active", Mark: VirginActiveMark, widthClass: "w-[168px]" },
  { key: "david-lloyd", slug: "david-lloyd", label: "David Lloyd", Mark: DavidLloydMark, widthClass: "w-[156px]" },
  { key: "nuffield-health", slug: "nuffield-health", label: "Nuffield Health", Mark: NuffieldHealthMark, widthClass: "w-[176px]" },
  { key: "third-space", slug: "third-space", label: "Third Space", Mark: ThirdSpaceMark, widthClass: "w-[150px]" },
  { key: "anytime-fitness", slug: "anytime-fitness", label: "Anytime Fitness", Mark: AnytimeFitnessMark, widthClass: "w-[180px]" },
  { key: "fitness-first", slug: "fitness-first", label: "Fitness First", Mark: FitnessFirstMark, widthClass: "w-[160px]" },
  { key: "everyone-active", slug: "everyone-active", label: "Everyone Active", Mark: EveryoneActiveMark, widthClass: "w-[176px]" },
  { key: "energie-fitness", slug: "energie-fitness", label: "énergie Fitness", Mark: EnergieFitnessMark, widthClass: "w-[160px]" },
  { key: "bannatyne", slug: "bannatyne", label: "Bannatyne", Mark: BannatyneMark, widthClass: "w-[160px]" },
];
