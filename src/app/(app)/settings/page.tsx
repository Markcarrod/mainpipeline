import { PageHeader } from "@/components/shared/page-header";
import { SettingsPanels } from "@/components/settings/settings-panels";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Workspace and integration settings"
        description="Core configuration surfaces for auth, scheduling, workspace defaults, and webhook readiness."
      />
      <SettingsPanels />
    </div>
  );
}
