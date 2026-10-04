import type { Mood } from "@/lib/mood";

const ALT: Record<Mood, string> = {
  approved: "Dollar giving a thumbs up",
  calm_neutral: "Dollar standing calmly",
  celebrating: "Dollar celebrating",
  concerned: "Dollar looking thoughtful",
  confused: "Dollar scratching its head",
  go_for_it: "Dollar carrying shopping bags",
  listening: "Dollar listening",
  not_right_now: "Dollar holding up its hands, not right now",
  oops: "Dollar saying oops",
  thinking: "Dollar thinking",
};

/** The app's dollar-sign character. Decorative by default (alt="") unless `label` is set. */
export function Mascot({
  mood,
  size = 96,
  label = false,
  className = "",
}: {
  mood: Mood;
  size?: number;
  label?: boolean;
  className?: string;
}) {
  return (
    <img
      src={`/mascot/${mood}.webp`}
      alt={label ? ALT[mood] : ""}
      width={size}
      height={size}
      draggable={false}
      className={`pointer-events-none select-none drop-shadow-[0_8px_14px_rgba(30,18,8,0.28)] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
