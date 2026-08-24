import { create } from "zustand";
import type { WhatsappIntegration } from "@/types";

interface ChannelState {
  numbers: WhatsappIntegration[];
  // undefined => not yet loaded; null => "All numbers"; string => one phoneNumberId
  activePhoneNumberId: string | null | undefined;
  setNumbers: (numbers: WhatsappIntegration[]) => void;
  setActive: (phoneNumberId: string | null) => void;
}

export const useChannelStore = create<ChannelState>((set) => ({
  numbers: [],
  activePhoneNumberId: undefined,
  setNumbers: (numbers) =>
    set((state) => ({
      numbers,
      activePhoneNumberId:
        state.activePhoneNumberId === undefined
          ? numbers.find((n) => n.isDefault)?.whatsapp?.phoneNumberId ?? (numbers.length === 1 ? numbers[0]?.whatsapp?.phoneNumberId : null)
          : state.activePhoneNumberId,
    })),
  setActive: (phoneNumberId) => set({ activePhoneNumberId: phoneNumberId }),
}));
