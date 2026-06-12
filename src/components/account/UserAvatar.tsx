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
        SIZES[size],
        ring && "ring-1 ring-white/15",
        className,
      )}
    >
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
      <AvatarFallback className="bg-reps-orange font-semibold text-white">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
