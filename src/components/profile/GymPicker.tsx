import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Globe, Loader2, MapPin, Plus, Users, X } from "lucide-react";
import { toast } from "sonner";

import {
  addMyGym,
  getMyGyms,
  importGoogleGym,
  removeMyGym,
  requestNewGym,
  searchGyms,
  type ExternalGymOption,
  type GymOption,
  type ProGym,
} from "@/lib/gyms.functions";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/* --------------------------- chip --------------------------- */

function GymChip({
  g,
  onRemove,
  removing,
}: {
  g: ProGym;
  onRemove: () => void;
  removing: boolean;
}) {
  const pending = g.gym.status === "pending_review";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border bg-reps-panel-soft pl-3 pr-1 py-1 text-[12px] ${
        pending
          ? "border-amber-400/30 text-amber-200"
          : "border-reps-border text-white/85"
      }`}
    >
      <Building2 className="h-3.5 w-3.5 text-white/55" />
      <span className="font-semibold">{g.gym.name}</span>
      {g.gym.area ? (
        <span className="text-white/45">· {g.gym.area}</span>
      ) : null}
      {pending ? (
        <span className="ml-1 inline-flex items-center gap-1 text-[10.5px] uppercase tracking-wide text-amber-300">
          <span className="inline-block size-1.5 rounded-full bg-amber-400" />
          Pending review
        </span>
      ) : null}
      <button
        type="button"
        aria-label={`Remove ${g.gym.name}`}
        onClick={onRemove}
        disabled={removing}
        className="flex h-5 w-5 items-center justify-center rounded-full text-white/55 hover:bg-white/10 hover:text-white disabled:opacity-50"
      >
        {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
      </button>
    </span>
  );
}

/* --------------------------- request-new inline form --------------------------- */

function RequestNewInline({
  initialName,
  onCancel,
  onDone,
}: {
  initialName: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [name, setName] = React.useState(initialName);
  const [area, setArea] = React.useState("");
  const [city, setCity] = React.useState("");
  const runRequest = useServerFn(requestNewGym);
  const m = useMutation({
    mutationFn: () => runRequest({ data: { name: name.trim(), area: area.trim(), city: city.trim() } }),
    onSuccess: () => {
      toast.success("Submitted for review — your chip is live with a 'Pending review' marker.");
      onDone();
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Couldn't submit gym.";
      toast.error(msg);
    },
  });
  const disabled = name.trim().length < 2 || city.trim().length < 2 || m.isPending;
  return (
    <div className="border-t border-reps-border px-3 py-3">
      <p className="text-[11.5px] text-white/55">
        Can't find it? Add it — we'll review and publish within ~24h.
      </p>
      <div className="mt-2 flex flex-col gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 80))}
          placeholder="Gym name"
          className="h-9 rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[13px] text-white outline-none focus:border-reps-orange-border"
        />
        <div className="flex gap-2">
          <input
            value={area}
            onChange={(e) => setArea(e.target.value.slice(0, 60))}
            placeholder="Area (optional)"
            className="h-9 flex-1 rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[13px] text-white outline-none focus:border-reps-orange-border"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value.slice(0, 60))}
            placeholder="City"
            className="h-9 flex-1 rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[13px] text-white outline-none focus:border-reps-orange-border"
          />
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={m.isPending}
            className="h-8 rounded-[10px] px-3 text-[12px] font-semibold text-white/65 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => m.mutate()}
            disabled={disabled}
            className="h-8 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover disabled:opacity-50"
          >
            {m.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Submit for review"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- main picker --------------------------- */

export function GymPicker() {
  const qc = useQueryClient();
  const fetchMine = useServerFn(getMyGyms);
  const runSearch = useServerFn(searchGyms);
  const runAdd = useServerFn(addMyGym);
  const runRemove = useServerFn(removeMyGym);

  const mineQ = useQuery({
    queryKey: ["my-gyms"],
    queryFn: () => fetchMine(),
    staleTime: 30_000,
  });
  const mine = mineQ.data ?? [];

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [requesting, setRequesting] = React.useState(false);

  const resultsQ = useQuery({
    queryKey: ["gyms-search", query],
    queryFn: () => runSearch({ data: { q: query, limit: 8 } }),
    enabled: open,
    staleTime: 30_000,
  });
  const results: GymOption[] = (resultsQ.data ?? []).filter(
    (r) => !mine.some((m) => m.gym_id === r.id),
  );

  const addM = useMutation({
    mutationFn: (gym_id: string) => runAdd({ data: { gym_id } }),
    onSuccess: () => {
      setOpen(false);
      setQuery("");
      void qc.invalidateQueries({ queryKey: ["my-gyms"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Couldn't add gym."),
  });

  const removeM = useMutation({
    mutationFn: (id: string) => runRemove({ data: { id } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-gyms"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Couldn't remove gym."),
  });

  const full = mine.length >= 3;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {mineQ.isPending ? (
          <span className="text-[12px] text-white/45">Loading…</span>
        ) : mine.length === 0 ? (
          <span className="text-[12px] text-white/45">
            No gyms added yet — optional.
          </span>
        ) : (
          mine.map((g) => (
            <GymChip
              key={g.id}
              g={g}
              removing={removeM.isPending && removeM.variables === g.id}
              onRemove={() => removeM.mutate(g.id)}
            />
          ))
        )}
      </div>

      {!full ? (
        <Popover
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) {
              setQuery("");
              setRequesting(false);
            }
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-9 w-fit items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/80 shadow-none hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add gym
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[340px] border-reps-border bg-reps-ink p-0 text-white"
          >
            {!requesting ? (
              <Command shouldFilter={false} className="bg-transparent">
                <CommandInput
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search by gym name or area…"
                  className="text-white placeholder:text-white/40"
                />
                <CommandList>
                  {resultsQ.isPending ? (
                    <div className="px-3 py-4 text-center text-[12px] text-white/55">
                      <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" />
                    </div>
                  ) : results.length === 0 ? (
                    <CommandEmpty className="py-4 text-center text-[12px] text-white/55">
                      {query.trim() ? `No match for "${query}".` : "No gyms found."}
                    </CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {results.map((g) => (
                        <CommandItem
                          key={g.id}
                          value={g.id}
                          onSelect={() => addM.mutate(g.id)}
                          className="cursor-pointer text-white data-[selected=true]:bg-reps-panel-soft data-[selected=true]:text-white"
                        >
                          <div className="flex w-full items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 shrink-0 text-white/55" />
                            <div className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate text-[13px] font-semibold">
                                {g.name}
                              </span>
                              <span className="truncate text-[11px] text-white/55">
                                {g.area ? `${g.area} · ` : ""}
                                {g.city}
                              </span>
                            </div>
                            {g.chain_name ? (
                              <span className="ml-2 shrink-0 text-[10.5px] text-white/45">
                                {g.chain_name}
                              </span>
                            ) : null}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
                <button
                  type="button"
                  onClick={() => setRequesting(true)}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-reps-border px-3 py-2.5 text-[11.5px] font-semibold text-reps-orange hover:bg-reps-panel-soft"
                >
                  <Plus className="h-3 w-3" />
                  Can't find it? Add a new gym
                </button>
              </Command>
            ) : (
              <RequestNewInline
                initialName={query}
                onCancel={() => setRequesting(false)}
                onDone={() => {
                  setOpen(false);
                  setQuery("");
                  setRequesting(false);
                  void qc.invalidateQueries({ queryKey: ["my-gyms"] });
                }}
              />
            )}
          </PopoverContent>
        </Popover>
      ) : (
        <p className="text-[11px] text-white/45">
          You've added the maximum of 3 gyms. Remove one to add another.
        </p>
      )}

      <p className="text-[11px] text-white/45 flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        Shown publicly on your profile and on directory cards. Optional.
      </p>
    </div>
  );
}
