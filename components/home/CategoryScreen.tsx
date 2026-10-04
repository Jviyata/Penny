"use client";

import { MONTH } from "@/lib/demoData";
import { money } from "@/lib/format";
import { CATEGORY_NOTE, SPENDING, type JobId, type Spend } from "@/lib/monthDetails";
import { useStore } from "@/lib/store";
import { NavButton, Screen } from "../ui/Screen";
import { ArrowLeftIcon, BagIcon, TargetIcon } from "../ui/Icons";
import { CATEGORY_ICONS } from "./categories";

/**
 * One slice of the month, opened from the donut or the icon row:
 * how much has gone out of it, and where and on what. Savings shows goals instead.
 */
export function CategoryScreen({ id, onBack }: { id: JobId; onBack: () => void }) {
  const job = MONTH.jobs.find((j) => j.id === id)!;
  const Icon = CATEGORY_ICONS[id];

  return (
    <Screen
      scene="home"
      photo={id}
      title={job.name}
      leading={
        <NavButton label="Back to your October" onClick={onBack}>
          <ArrowLeftIcon />
        </NavButton>
      }
    >
      {id === "savings" ? <Savings total={job.amount} /> : <Spending id={id} total={job.amount} Icon={Icon} />}
    </Screen>
  );
}

function Spending({ id, total, Icon }: { id: Exclude<JobId, "savings">; total: number; Icon: (typeof CATEGORY_ICONS)[JobId] }) {
  const items = SPENDING[id];
  const paid = items.filter((s) => !s.upcoming);
  const upcoming = items.filter((s) => s.upcoming);
  const spent = paid.reduce((t, s) => t + s.amount, 0);
  const share = Math.min(1, spent / total);

  return (
    <>
      <div className="px-5">
        <section className="on-photo-shadow -mt-1">
          <p className="tabular text-[56px] font-bold leading-none tracking-[-0.025em] text-on-photo">{money(spent)}</p>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <p className="text-[19px] text-on-photo-2">of {money(total)} this month</p>
            <span className="glass tabular flex h-10 shrink-0 items-center rounded-full px-4 text-[17px] font-semibold text-on-photo">
              {Math.round(share * 100)}%
            </span>
          </div>
        </section>
        <div className="glass mt-4 h-3.5 overflow-hidden rounded-full" aria-hidden>
          <div className="h-full rounded-full bg-[#f1ead9]" style={{ width: `${share * 100}%` }} />
        </div>
        <p className="on-photo-shadow mt-2.5 text-[14px] text-on-photo-2">{CATEGORY_NOTE[id]}</p>
      </div>

      <section className="mx-3 mt-5 overflow-hidden rounded-[30px] bg-card pb-2">
        <List title="Recent" items={paid} Icon={Icon} />
        {upcoming.length > 0 && <List title="Coming up" items={upcoming} Icon={Icon} muted />}
      </section>
    </>
  );
}

function List({ title, items, Icon, muted }: { title: string; items: Spend[]; Icon: (typeof CATEGORY_ICONS)[JobId]; muted?: boolean }) {
  return (
    <>
      <h2 className="px-5 pb-1 pt-4 text-[19px] font-semibold">{title}</h2>
      <ul>
        {items.map((s) => (
          <li key={s.id} className="flex min-h-[72px] items-center gap-3.5 px-5 py-2.5">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-[#3b3128] ${muted ? "bg-fill opacity-70" : "bg-[#e9dccb]"}`}>
              <Icon size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[17px]">{s.name}</span>
              <span className="block truncate text-[14px] text-label-3">
                {s.what} · {s.date}
              </span>
            </span>
            <span className={`tabular text-[17px] font-medium ${muted ? "text-label-2" : ""}`}>{money(s.amount)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Savings({ total }: { total: number }) {
  const GOALS = useStore().state.goals;
  const saved = GOALS.reduce((t, g) => t + g.saved, 0);
  return (
    <>
      <div className="px-5">
        <section className="on-photo-shadow -mt-1">
          <p className="tabular text-[56px] font-bold leading-none tracking-[-0.025em] text-on-photo">{money(total)}</p>
          <p className="mt-1.5 text-[19px] text-on-photo-2">set aside this month</p>
          <p className="mt-2.5 text-[14px] text-on-photo-2">
            {CATEGORY_NOTE.savings} {money(saved)} saved so far across {GOALS.length} goals.
          </p>
        </section>
      </div>

      <section className="mx-3 mt-5 overflow-hidden rounded-[30px] bg-card pb-3">
        <h2 className="px-5 pb-1 pt-4 text-[19px] font-semibold">Goals</h2>
        <ul>
          {GOALS.map((g) => {
            const share = Math.min(1, g.saved / g.target);
            return (
              <li key={g.id} className="px-5 py-3">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#dfe6d3] text-[#3b3128]">
                    <TargetIcon size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px]">{g.name}</span>
                    <span className="block text-[14px] text-label-3">
                      +{money(g.thisMonth)} this month · {g.by}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="tabular block text-[17px] font-medium">{money(g.saved)}</span>
                    <span className="tabular block text-[13px] text-label-3">of {money(g.target)}</span>
                  </span>
                </div>
                <div className="ml-[62px] mt-2.5 h-2 overflow-hidden rounded-full bg-fill" aria-label={`${Math.round(share * 100)}% of the way`}>
                  <div className="h-full rounded-full bg-[var(--v-comfortable)]" style={{ width: `${share * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

/**
 * Opened from the sparkle ("Yours") slice: free spending for the month, money that's just for you.
 * Shows what's available and what you've bought for yourself. Plans live on the Free spending tab.
 */
export function YoursScreen({ onBack }: { onBack: () => void }) {
  const { state, open } = useStore();
  const { bought } = state;
  const spent = bought.reduce((t, b) => t + b.amount, 0);
  const available = Math.max(open, 0);
  const share = available + spent > 0 ? spent / (available + spent) : 0;

  return (
    <Screen
      scene="home"
      title="Yours"
      leading={
        <NavButton label="Back to your October" onClick={onBack}>
          <ArrowLeftIcon />
        </NavButton>
      }
    >
      <div className="px-5">
        <section className="on-photo-shadow -mt-1">
          <p className="tabular text-[56px] font-bold leading-none tracking-[-0.025em] text-on-photo">{money(available)}</p>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <p className="text-[19px] text-on-photo-2">available for you</p>
            <span className="glass tabular flex h-10 shrink-0 items-center rounded-full px-4 text-[17px] font-semibold text-on-photo">
              {money(spent)} spent
            </span>
          </div>
        </section>
        <div className="glass mt-4 h-3.5 overflow-hidden rounded-full" aria-hidden>
          <div className="h-full rounded-full bg-[#f1ead9]" style={{ width: `${share * 100}%` }} />
        </div>
        <p className="on-photo-shadow mt-2.5 text-[14px] text-on-photo-2">
          {open < 0
            ? `You’ve gone ${money(-open)} past what was open. Moving a plan on the Free spending tab would balance it.`
            : `Money that’s just for you, through the end of ${MONTH.name}.`}
        </p>
      </div>

      <section className="mx-3 mt-5 overflow-hidden rounded-[30px] bg-card pb-2">
        <h2 className="px-5 pb-1 pt-4 text-[19px] font-semibold">What you bought</h2>
        {bought.length === 0 ? (
          <p className="px-5 pb-4 pt-1 text-[15px] text-label-2">Nothing yet this month.</p>
        ) : (
          <ul>
            {[...bought].reverse().map((b) => (
              <li key={b.id} className="flex items-center gap-3.5 px-5 py-3 [&:not(:last-child)]:shadow-[0_1px_0_var(--sep)]">
                <span className="h-16 w-16 shrink-0 overflow-hidden rounded-[16px] bg-[#e9dccb] text-[#3b3128]">
                  {b.image ? (
                    <img src={b.image} alt="" className="h-full w-full object-cover" draggable={false} />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <BagIcon size={24} />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] leading-[21px]">{b.note ?? `You bought ${b.name}.`}</span>
                  <span className="mt-0.5 block truncate text-[13px] text-label-3">
                    {[b.name, b.date].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="tabular shrink-0 text-[17px] font-semibold">{money(b.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Screen>
  );
}
