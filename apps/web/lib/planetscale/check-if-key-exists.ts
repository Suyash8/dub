import { prisma } from "@/lib/prisma";
import { punyEncode, safeDecodeURIComponent } from "@dub/utils";
import {
  encodeKey,
  isCaseSensitiveDomain,
} from "../api/links/case-sensitivity";

export const checkIfKeyExists = async ({
  domain,
  key,
}: {
  domain: string;
  key: string;
}) => {
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
    select: { id: true },
  });

  return Boolean(link);
};
