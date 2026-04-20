import { CampaignsView } from "@/components/campaigns/campaigns-view";
import { PageHeader } from "@/components/shared/page-header";
import { getPortalDataset } from "@/lib/portal-data";

export default async function CampaignsPage() {
  const dataset = await getPortalDataset();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Campaigns"
        title="Campaign-level performance"
        description="Review the motions generating conversations, positive replies, and booked meetings."
      />
      <CampaignsView dataset={dataset} />
    </div>
  );
}
