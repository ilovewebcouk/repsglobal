import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initialsFromName } from "@/lib/initials";

const SIZES = {
  sm: "size-7 text-[11px] rounded-[6px]",
  md: "size-9 text-[12px] rounded-[8px]",
  lg: "size-11 text-[14px] rounded-[10px]",
} as const;

const RADII = {
  sm: "rounded-[6px]",
  md: "rounded-[8px]",
  lg: "rounded-[10px]",
} as const;

export type UserAvatarSize = keyof typeof SIZES;

export type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: UserAvatarSize;
  className?: string;
  ring?: boolean;
};


export function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  className,
  ring,
}: UserAvatarProps) {
  const radius = RADII[size];
  return (
    <Avatar
      className={cn(
        SIZES[size],
        ring && "ring-1 ring-white/15",
        className,
      )}
    >
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className={radius} /> : null}
      <AvatarFallback className={cn(radius, "bg-reps-panel-soft text-white/40")}>
        {initialsFromName(name)}
      </AvatarFallback>
    </Avatar>
  );
}
