import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initialsFromName } from "@/lib/initials";

const SIZES = {
  sm: "size-7 text-[11px] rounded-[6px]",
  md: "size-9 text-[12px] rounded-[8px]",
  lg: "size-11 text-[14px] rounded-[10px]",
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
  
  return (
    <Avatar
      className={cn(
        SIZES[size],
        ring && "ring-1 ring-white/15",
        className,
      )}
    >
      {/* Inner radius is intentionally `rounded-none` — the Avatar root has
          `overflow-hidden` + the size/className radius, so the parent already
          clips. Setting an inner radius creates a visible gap between the
          parent border and the image/fallback corners. */}
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="rounded-none" /> : null}
      <AvatarFallback className={cn("rounded-none bg-reps-panel-soft text-white/40")}>
        {initialsFromName(name)}
      </AvatarFallback>
    </Avatar>
  );
}
