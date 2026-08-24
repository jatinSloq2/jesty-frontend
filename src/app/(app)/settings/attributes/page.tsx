import { SettingsTabs } from "@/components/settings/settings-tabs";
import { AttributeManager } from "@/components/settings/attribute-manager";

export default function AttributesSettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-bg-app">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <SettingsTabs active="attributes" />
        <div className="mt-6">
          <AttributeManager />
        </div>
      </div>
    </div>
  );
}
