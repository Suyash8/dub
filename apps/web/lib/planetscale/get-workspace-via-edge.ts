import { prisma } from "@/lib/prisma";
import { normalizeWorkspaceId } from "../api/workspaces/workspace-id";
import { WorkspaceProps } from "../types";

export const getWorkspaceViaEdge = async ({
  workspaceId,
  includeDomains = false,
}: {
  workspaceId: string;
  includeDomains?: boolean;
}) => {
  const id = normalizeWorkspaceId(workspaceId);

  if (!includeDomains) {
    const workspace = await prisma.project.findUnique({
      where: { id },
    });

    return workspace as WorkspaceProps | null;
  }

  const workspace = await prisma.project.findUnique({
    where: { id },
    include: {
      domains: {
        select: {
          slug: true,
        },
      },
    },
  });

  return workspace as (WorkspaceProps & { domains: { slug: string }[] }) | null;
};
