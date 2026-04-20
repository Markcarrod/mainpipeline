import { ClientsPageView } from "@/components/clients/clients-page-view";
import { getPortalDataset } from "@/lib/portal-data";

export default async function ClientsPage() {
  const dataset = await getPortalDataset();

  return <ClientsPageView dataset={dataset} />;
}
