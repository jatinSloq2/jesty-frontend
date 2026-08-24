import { SettingsTabs } from "@/components/settings/settings-tabs";
import { TagManager } from "@/components/settings/tag-manager";

export default function TagsSettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-bg-app">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <SettingsTabs active="tags" />
        <div className="mt-6">
          <TagManager />
        </div>
      </div>
    </div>
  );
}
