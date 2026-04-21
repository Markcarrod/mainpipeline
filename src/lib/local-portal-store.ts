import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { Client, ClientIntegration } from "@/types/portal";

const STORAGE_DIRECTORY = process.env.VERCEL ? "/tmp/buyer-radar" : join(process.cwd(), ".local");
const STORAGE_FILE = join(STORAGE_DIRECTORY, "portal-data.json");

interface LocalPortalStore {
  clients: Client[];
  clientIntegrations: ClientIntegration[];
}

const emptyStore: LocalPortalStore = {
  clients: [],
  clientIntegrations: [],
};

export async function readLocalPortalStore(): Promise<LocalPortalStore> {
  try {
    const raw = await readFile(STORAGE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalPortalStore>;

    return {
      clients: Array.isArray(parsed.clients) ? (parsed.clients as Client[]) : [],
      clientIntegrations: Array.isArray(parsed.clientIntegrations)
        ? (parsed.clientIntegrations as ClientIntegration[])
        : [],
    };
  } catch {
    return emptyStore;
  }
}

export async function upsertLocalClient(client: Client, integration?: ClientIntegration) {
  const current = await readLocalPortalStore();
  const clients = [client, ...current.clients.filter((item) => item.id !== client.id)];
  const clientIntegrations = integration
    ? [integration, ...current.clientIntegrations.filter((item) => item.id !== integration.id)]
    : current.clientIntegrations;

  await mkdir(STORAGE_DIRECTORY, { recursive: true });
  await writeFile(
    STORAGE_FILE,
    JSON.stringify(
      {
        clients,
        clientIntegrations,
      },
      null,
      2,
    ),
    "utf8",
  );
}

export async function deleteLocalClient(clientId: string) {
  const current = await readLocalPortalStore();
  const clients = current.clients.filter((item) => item.id !== clientId);
  const clientIntegrations = current.clientIntegrations.filter((item) => item.clientId !== clientId);

  await mkdir(STORAGE_DIRECTORY, { recursive: true });
  await writeFile(
    STORAGE_FILE,
    JSON.stringify(
      {
        clients,
        clientIntegrations,
      },
      null,
      2,
    ),
    "utf8",
  );
}
