import "server-only";
import { AtlasError } from "./errors";

export const DEFAULT_ATLAS_BASE_URL = "https://api.youratlas.com/v1/api";

export type AtlasConfig = { apiKey: string; baseUrl: string };

type AtlasEnvironment = Record<string, string | undefined>;

export function getAtlasConfig(
  env: AtlasEnvironment = process.env,
): AtlasConfig {
  const apiKey = env.ATLAS_API_KEY?.trim();
  if (!apiKey) throw new AtlasError("CONFIGURATION", "Atlas is not configured");

  const rawBaseUrl = env.ATLAS_BASE_URL?.trim() || DEFAULT_ATLAS_BASE_URL;
  let url: URL;
  try {
    url = new URL(rawBaseUrl);
  } catch {
    throw new AtlasError("CONFIGURATION", "Atlas base URL is invalid");
  }
  if (url.protocol !== "https:")
    throw new AtlasError("CONFIGURATION", "Atlas base URL must use HTTPS");

  return { apiKey, baseUrl: url.toString().replace(/\/$/, "") };
}

export function getAtlasCampaignId(
  env: AtlasEnvironment = process.env,
): string {
  const campaignId = env.ATLAS_CAMPAIGN_ID?.trim();
  if (!campaignId)
    throw new AtlasError("CONFIGURATION", "Atlas campaign is not configured");
  return campaignId;
}
