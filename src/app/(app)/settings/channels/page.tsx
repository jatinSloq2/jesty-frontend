"use client";

import gsap from "gsap";
import { useChannelStore } from "@/providers/channel-store";
import { useGsapContext } from "@/hooks/use-gsap-context";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { ChannelCard } from "@/components/settings/channel-card";
import { ConnectNumberDialog } from "@/components/settings/connect-number-dialog";

export default function ChannelsSettingsPage() {
  const numbers = useChannelStore((s) => s.numbers);
  const setNumbers = useChannelStore((s) => s.setNumbers);

  const scope = useGsapContext<HTMLDivElement>((_ctx, el) => {
    gsap.from(el.querySelectorAll("[data-card]"), { autoAlpha: 0, y: 10, duration: 0.35, stagger: 0.06, ease: "power2.out" });
  }, [numbers.length]);

  return (
    <div className="flex-1 overflow-y-auto bg-bg-app">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <SettingsTabs active="channels" />

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Connected WhatsApp numbers</h2>
          <ConnectNumberDialog onConnected={(i) => setNumbers([i, ...numbers])} />
        </div>

        <div ref={scope} className="mt-4 space-y-3">
          {numbers.length === 0 && (
            <p className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No WhatsApp numbers connected yet.
            </p>
          )}
          {numbers.map((n) => (
            <div key={n.id} data-card>
              <ChannelCard
                integration={n}
                onUpdated={(updated) => setNumbers(numbers.map((x) => (x.id === updated.id ? updated : x)))}
                onRemoved={(id) => setNumbers(numbers.filter((x) => x.id !== id))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
