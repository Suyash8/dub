import { prisma } from "@/lib/prisma";
import { punyEncode, safeDecodeURIComponent } from "@dub/utils";
import {
  decodeKeyIfCaseSensitive,
  encodeKey,
  isCaseSensitiveDomain,
} from "../api/links/case-sensitivity";
import { EdgeLinkProps } from "./types";

const getLinkViaEdgeHelper = async ({
  domain,
  key,
}: {
  domain: string;
  key: string;
}): Promise<EdgeLinkProps | null> => {
  const isCaseSensitive = isCaseSensitiveDomain(domain);
  const keyToQuery = isCaseSensitive
    ? // for case sensitive domains, we need to encode the key
      encodeKey(key)
    : // for non-case sensitive domains, we need to make sure that the key is always URI-decoded + punycode-encoded
      punyEncode(safeDecodeURIComponent(key));

  const link = await prisma.link.findUnique({
    where: {
      domain_key: {
        domain,
        key: keyToQuery,
      },
    },
  });

  if (!link) return null;

  return {
    ...link,
    title: link.title ?? "",
    description: link.description ?? "",
    image: link.image ?? "",
    video: link.video ?? "",
    key: decodeKeyIfCaseSensitive({ domain, key }),
  };
};

const inFlightLinkLookups = new Map<
  string,
  Promise<Awaited<ReturnType<typeof getLinkViaEdgeHelper>>>
>();

export const getLinkViaEdge = async ({
  domain,
  key,
}: {
  domain: string;
  key: string;
}): Promise<Awaited<ReturnType<typeof getLinkViaEdgeHelper>>> => {
  const lookupKey = `${domain}:${key}`;
  const existingLookup = inFlightLinkLookups.get(lookupKey);

  if (existingLookup) {
    console.log(`[getLinkViaEdge] ${lookupKey} - Existing lookup found`);
    return await existingLookup;
  }

  const lookupPromise = getLinkViaEdgeHelper({ domain, key }).finally(() => {
    inFlightLinkLookups.delete(lookupKey);
  });

  inFlightLinkLookups.set(lookupKey, lookupPromise);

  return await lookupPromise;
};
