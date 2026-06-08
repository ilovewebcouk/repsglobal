import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Search, MapPin, Sparkles, ShieldCheck, BookOpen } from "lucide-react";
import {
  TOP_PROFESSIONS,
  TOP_LOCATIONS,
  TRAIN_GOALS,
} from "./nav-config";

export function HeaderCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();

  const go = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search professionals, cities, goals…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Quick actions">
          <CommandItem
            onSelect={() => go(() => navigate({ to: "/find-a-professional" }))}
          >
            <Search />
            <span>Browse all professionals</span>
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/resources" }))}>
            <BookOpen />
            <span>Read resources</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Train by goal">
          {TRAIN_GOALS.map((g) => (
            <CommandItem
              key={g.slug}
              onSelect={() => go(() => navigate({ to: "/find-a-professional" }))}
            >
              <Sparkles />
              <span>{g.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Professions">
          {TOP_PROFESSIONS.map((p) => (
            <CommandItem
              key={p.slug}
              onSelect={() =>
                go(() =>
                  navigate({
                    to: "/professions/$profession",
                    params: { profession: p.slug },
                  }),
                )
              }
            >
              <Search />
              <span>{p.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Cities">
          {TOP_LOCATIONS.map((l) => (
            <CommandItem
              key={l.slug}
              onSelect={() =>
                go(() =>
                  navigate({
                    to: "/in/$location",
                    params: { location: l.slug },
                  }),
                )
              }
            >
              <MapPin />
              <span>{l.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
