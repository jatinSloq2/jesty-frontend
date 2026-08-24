"use client";

import gsap from "gsap";
import { useChannelStore } from "@/providers/channel-store";
import { useGsapContext } from "@/hooks/use-gsap-context";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { ChannelSelector } from "@/components/inbox/channel-selector";
import { BusinessProfileForm } from "@/components/settings/business-profile-form";

export default function BusinessProfileSettingsPage() {
  const activePhoneNumberId = useChannelStore((s) => s.activePhoneNumberId);

  const scope = useGsapContext<HTMLDivElement>((_ctx, el) => {
    gsap.from(el, { autoAlpha: 0, y: 10, duration: 0.35, ease: "power2.out" });
  }, [activePhoneNumberId]);

  return (
    <div className="flex-1 overflow-y-auto bg-bg-app">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <SettingsTabs active="profile" />

        <div className="mt-6 max-w-xs">
          <ChannelSelector />
        </div>

        <div ref={scope} className="mt-6">
          <BusinessProfileForm phoneNumberId={activePhoneNumberId ?? undefined} />
        </div>
      </div>
    </div>
  );
}
