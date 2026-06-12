import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-[12px]",
  lg: "size-11 text-[14px]",
} as const;

export type UserAvatarSize = keyof typeof SIZES;

export type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: UserAvatarSize;
  className?: string;
  ring?: boolean;
};

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

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
        "rounded-[10px]",
        SIZES[size],
        ring && "ring-1 ring-white/15",
        className,
      )}
    >
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="rounded-[10px]" /> : null}
      <AvatarFallback className="rounded-[10px] bg-reps-panel-soft text-white/40">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
