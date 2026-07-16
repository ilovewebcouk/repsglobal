import * as React from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Bell, Mail, ShieldAlert, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useSupportUnread } from "@/hooks/useSupportUnread";
import { useMySupportUnread } from "@/hooks/useMySupportUnread";
import { useReviewsUnread } from "@/hooks/useReviewsUnread";
import { useVerificationUnread } from "@/hooks/useVerificationUnread";
import { useAdminVerificationPending } from "@/hooks/useAdminVerificationPending";
import { useSessionUser } from "@/hooks/use-session-user";


function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

type FeedItem =
  | {
      kind: "support-admin";
      key: string;
      title: string;
      preview: string;
      ticketNumber: string | null;
      createdAt: string;
    }
  | {
      kind: "support-mine";
      key: string;
      title: string;
      preview: string;
      ticketId: string;
      ticketNumber: string | null;
      createdAt: string;
    }
  | {
      kind: "review";
      key: string;
      title: string;
      preview: string;
      createdAt: string;
      rating: number;
    }
  | {
      kind: "verification";
      key: string;
      title: string;
      preview: string;
      createdAt: string;
      href: string;
    };

export function NotificationsBell() {
  const router = useRouter();
  const { user, isAdmin } = useSessionUser();
  const adminSupport = useSupportUnread({ enabled: isAdmin });
  const mySupport = useMySupportUnread({ enabled: !!user });
  const reviews = useReviewsUnread({ enabled: !!user });
  const verification = useVerificationUnread({ enabled: !!user && !isAdmin });
  const adminVerification = useAdminVerificationPending({ enabled: isAdmin });
  const [open, setOpen] = React.useState(false);

  const combined = React.useMemo<FeedItem[]>(() => {
    const adminSupportItems: FeedItem[] = adminSupport.items.map((i) => ({
      kind: "support-admin",
      key: i.key,
      title: i.title,
      preview: i.preview,
      ticketNumber: i.ticketNumber,
      createdAt: i.createdAt,
    }));
    const mySupportItems: FeedItem[] = mySupport.items.map((i) => ({
      kind: "support-mine",
      key: i.key,
      title: `Reply on ${i.title}`,
      preview: i.preview,
      ticketId: i.ticketId,
      ticketNumber: i.ticketNumber,
      createdAt: i.createdAt,
    }));
    const reviewItems: FeedItem[] = reviews.items.map((i) => ({
      kind: "review",
      key: i.key,
      title: `${i.rating}★ review for ${i.professionalName ?? "a pro"}`,
      preview: `${i.clientName}: "${i.preview}"`,
      createdAt: i.createdAt,
      rating: i.rating,
    }));
    const verificationItems: FeedItem[] = verification.items.map((i) => ({
      kind: "verification",
      key: i.key,
      title: i.title,
      preview: i.preview,
      createdAt: i.createdAt,
      href: i.href,
    }));
    const adminVerificationItems: FeedItem[] = adminVerification.items.map((i) => ({
      kind: "verification",
      key: i.key,
      title: i.title,
      preview: i.preview,
      createdAt: i.createdAt,
      href: i.href,
    }));
    return [
      ...verificationItems,
      ...adminVerificationItems,
      ...reviewItems,
      ...adminSupportItems,
      ...mySupportItems,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [
    adminSupport.items,
    mySupport.items,
    reviews.items,
    verification.items,
    adminVerification.items,
  ]);

  const unread = combined.length;
  const [snapshot, setSnapshot] = React.useState<FeedItem[] | null>(null);
  const visible = open && snapshot ? snapshot : combined;
  const isLoading =
    adminSupport.isLoading ||
    mySupport.isLoading ||
    reviews.isLoading ||
    verification.isLoading ||
    adminVerification.isLoading;

  const handleOpenChange = (next: boolean) => {
    if (next) setSnapshot(combined);
    else setSnapshot(null);
    setOpen(next);
  };

  const markAll = async () => {
    const tasks: Array<Promise<unknown>> = [];
    if (isAdmin) tasks.push(adminSupport.markAllRead());
    if (user) {
      tasks.push(mySupport.markAllRead());
      tasks.push(reviews.markAllRead());
      tasks.push(verification.markAllRead());
    }
    await Promise.all(tasks);
    setSnapshot([]);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={unread > 0 ? `Notifications (${unread} new)` : "Notifications"}
          className="relative h-10 w-10 rounded-[10px] border-reps-border bg-reps-panel text-white/80 transition-colors hover:bg-reps-panel-soft hover:text-white"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span
              aria-hidden
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-reps-orange px-1 text-[10px] font-semibold leading-none text-reps-ink ring-2 ring-reps-ink"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] border-reps-border bg-reps-panel p-0 text-white"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold text-white">Notifications</p>
            <p className="text-[11px] text-white/55">
              Reviews, support tickets, and inbound emails
            </p>
          </div>
          {visible.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px] text-white/70 hover:text-white"
              onClick={() => void markAll()}
            >
              Mark all read
            </Button>
          ) : null}
        </div>
        <Separator className="bg-reps-border" />
        <div className="max-h-[420px] overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-6 text-[12px] text-white/55">Loading…</div>
          ) : visible.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12px] text-white/55">
              You're all caught up.
            </div>
          ) : (
            <ul className="divide-y divide-reps-border">
              {visible.map((item) => {
                const rawHref =
                  item.kind === "verification"
                    ? item.href
                    : item.kind === "review"
                      ? "/admin/reviews"
                      : item.kind === "support-admin"
                        ? "/admin/support"
                        : "/dashboard/support";
                const [hrefPath, hrefHash] = rawHref.split("#");
                const showTicket =
                  (item.kind === "support-admin" || item.kind === "support-mine") &&
                  item.ticketNumber;
                const iconWrapClass =
                  item.kind === "verification"
                    ? "bg-red-500/15 text-red-300"
                    : item.kind === "review"
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-reps-orange/15 text-reps-orange";
                return (
                  <li key={item.key}>
                    <Link
                      to={hrefPath}
                      hash={hrefHash}
                      onClick={() => {
                        setOpen(false);
                        if (hrefHash) {
                          setTimeout(() => {
                            document
                              .getElementById(hrefHash)
                              ?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 120);
                        }
                      }}
                      className="flex gap-3 px-4 py-3 transition-colors hover:bg-reps-panel-soft"
                    >

                      <div
                        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[8px] ${iconWrapClass}`}
                      >
                        {item.kind === "verification" ? (
                          <ShieldAlert className="h-3.5 w-3.5" />
                        ) : item.kind === "review" ? (
                          <Star className="h-3.5 w-3.5" />
                        ) : (
                          <Mail className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[13px] font-medium text-white">
                            {item.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-white/45">
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11.5px] text-white/55">
                          {item.preview}
                        </p>
                        {showTicket ? (
                          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/40">
                            {item.ticketNumber}
                          </p>
                        ) : null}
                      </div>
                      <span
                        aria-hidden
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-reps-orange"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Separator className="bg-reps-border" />
        <div className="grid grid-cols-2 gap-1 px-4 py-2">
          <Link
            to={isAdmin ? "/admin/reviews" : "/dashboard/reviews"}
            onClick={() => setOpen(false)}
            className="block rounded-[8px] py-1.5 text-center text-[12px] font-medium text-white/80 transition-colors hover:bg-reps-panel-soft hover:text-white"
          >
            Reviews
          </Link>
          <Link
            to={isAdmin ? "/admin/support" : "/dashboard/support"}
            onClick={() => setOpen(false)}
            className="block rounded-[8px] py-1.5 text-center text-[12px] font-medium text-white/80 transition-colors hover:bg-reps-panel-soft hover:text-white"
          >
            Support
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
