import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, CreditCard, Inbox, MessageSquare } from "lucide-react";

import {
  BookingsMockup,
  LeadsMockup,
  MessagesMockup,
  PaymentsMockup,
} from "@/components/mockups/PlatformMockups";

function Tile({
  tag,
  title,
  body,
  icon: Icon,
  children,
  className = "",
}: {
  tag: string;
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to="/features/operations"
      className={`group relative flex flex-col overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel/40 transition-colors hover:border-reps-orange-border ${className}`}
    >
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
            <Icon className="h-3.5 w-3.5" />
            {tag}
          </span>
          <h3 className="mt-2 font-display text-[20px] font-bold leading-tight text-white">
            {title}
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">{body}</p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-white/30 transition-colors group-hover:text-reps-orange" />
      </div>
      <div className="relative mt-auto overflow-hidden border-t border-reps-border">
        <div className="pointer-events-none [&_*]:!cursor-default">{children}</div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-reps-panel/40"
        />
      </div>
    </Link>
  );
}

export function OperationsBento() {
  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:auto-rows-[minmax(420px,auto)]">
      {/* Leads — tall hero tile */}
      <Tile
        tag="Leads"
        title="Every enquiry, scored on intent."
        body="Pipeline from first touch to first session. AI scores hot leads and drafts the reply in your tone of voice."
        icon={Inbox}
        className="lg:col-span-2 lg:row-span-2"
      >
        <LeadsMockup />
      </Tile>

      {/* Bookings */}
      <Tile
        tag="Bookings & calendar"
        title="A week that fills itself."
        body="Two-way calendar sync, deposits at booking, automated reminders."
        icon={Calendar}
      >
        <BookingsMockup />
      </Tile>

      {/* Payments */}
      <Tile
        tag="Payments & subs"
        title="Stripe payouts. No chasing."
        body="Packages, memberships, failed-card retries. REPs takes no booking commission."
        icon={CreditCard}
      >
        <PaymentsMockup />
      </Tile>

      {/* Messages — wide on bottom */}
      <Tile
        tag="Messages"
        title="A focused client inbox."
        body="WhatsApp is for friends. REPs Messages is threaded, attached to the client record, with AI-drafted replies."
        icon={MessageSquare}
        className="lg:col-span-3"
      >
        <MessagesMockup />
      </Tile>
    </div>
  );
}
