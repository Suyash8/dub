import { prisma } from "@/lib/prisma";
import { EdgeLinkProps } from "./types";

export const getShortLinkViaEdge = async (
  shortLink: string,
): Promise<EdgeLinkProps | null> => {
  const link = await prisma.link.findUnique({
    where: { shortLink },
  });

  if (!link) return null;

  return {
    ...link,
    title: link.title ?? "",
    description: link.description ?? "",
    image: link.image ?? "",
    video: link.video ?? "",
  };
};
