import { prisma } from "@/lib/prisma";
import { LRUCache } from "lru-cache";
import { EdgeDomainProps } from "./types";

const domainLRUCache = new LRUCache<string, EdgeDomainProps>({
  max: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
});

export const getDomainViaEdge = async (domain: string) => {
  const cached = domainLRUCache.get(domain);
  if (cached) {
    return cached;
  }

  const result = await prisma.domain.findUnique({
    where: { slug: domain },
  });

  if (result !== null) {
    domainLRUCache.set(domain, result);
  }
  return result;
};
