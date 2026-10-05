"use client";

import { money } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useSend } from "@/lib/useSend";
import type { ShelfItem } from "@/lib/types";
import { Mascot } from "../ui/Mascot";
import { Screen } from "../ui/Screen";
import { XIcon } from "../ui/Icons";
import type { Tab } from "../TabBar";

export function ShelfScreen({ goTo }: { goTo: (t: Tab) => void }) {
  const { state, dispatch } = useStore();
  const send = useSend();

  // Ask again with the latest numbers; the photo comes along so the card shows it.
  const askAgain = (item: ShelfItem) => {
    goTo("chat");
    send({
      text: `Can I afford the ${item.name.toLowerCase()} now?`,
      image: item.image ? { full: item.image, thumb: item.image } : undefined,
      hint: { name: item.name, price: item.price },
    });
  };

  return (
    <Screen scene="shelf" title="Wishlist" subtitle="Things you want, just not right now.">
      {state.shelf.length === 0 ? (
        <section className="mx-3 mt-2 flex flex-col items-center rounded-[30px] bg-card px-8 pb-8 pt-6 text-center">
          <Mascot mood="calm_neutral" size={132} />
          <p className="mt-2 text-[19px] font-semibold">Nothing on your wishlist yet</p>
          <p className="mt-1 text-[15px] leading-[20px] text-label-2">
            When something fits better later, save it here and come back to it.
          </p>
          <button
            type="button"
            onClick={() => goTo("chat")}
            className="pressable mt-5 h-12 rounded-full bg-cta px-6 text-[16px] font-semibold text-on-cta"
          >
            Ask about something
          </button>
        </section>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 px-3">
            {state.shelf.map((item) => (
              <li key={item.id} className="relative overflow-hidden rounded-[24px] bg-card">
                <button type="button" onClick={() => askAgain(item)} className="pressable block w-full text-left">
                  <div className="m-2 mb-0 aspect-square overflow-hidden rounded-[18px] bg-fill">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-full w-full object-cover" draggable={false} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[44px] font-bold text-label-3">
                        {item.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="px-3.5 pb-3.5 pt-2.5">
                    <p className="truncate text-[16px] font-semibold">{item.name}</p>
                    <p className="tabular text-[15px] text-label-2">{money(item.price)}</p>
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] leading-[17px] text-label-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--v-later)]" />
                      {item.status}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${item.name} from your wishlist`}
                  onClick={() => dispatch({ type: "removeFromShelf", id: item.id })}
                  className="absolute right-0 top-0 flex h-12 w-12 items-start justify-end p-3"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
                    <XIcon size={12} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="on-photo-shadow px-8 pt-4 text-center text-[13px] text-on-photo-2">
            Tap anything to check it again with today’s numbers.
          </p>
        </>
      )}
    </Screen>
  );
}
