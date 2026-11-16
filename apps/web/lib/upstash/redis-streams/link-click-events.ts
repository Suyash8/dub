import { logger, toErrorFields } from "@/lib/axiom/server";
import { prisma } from "@/lib/prisma";
import { redis } from "../redis";
import { RedisStream } from "./client";

const STREAM_KEY = "link:click:events";

export const linkClickEventStream = new RedisStream(STREAM_KEY);

export interface LinkClickEvent {
  linkId: string;
  timestamp: string;
  workspaceId?: string;
}

// Publishes a link click event to the stream to update:
// - link clicks count + lastClicked timestamp
// - workspace usage + totalClicks
export const publishLinkClickEvent = async ({
  linkId,
  timestamp,
  workspaceId,
}: LinkClickEvent) => {
  const payload = {
    linkId,
    timestamp,
    ...(workspaceId && { workspaceId }),
  };

  try {
    return await redis.xadd(STREAM_KEY, "*", payload);
  } catch (error) {
    logger.error("stream.publish_failed", {
      service: "upstash",
      streamKey: STREAM_KEY,
      error: toErrorFields(error),
      correlation: {
        linkId,
        workspaceId,
      },
    });

    return await Promise.allSettled([
      prisma.link.update({
        where: { id: linkId },
        data: {
          clicks: { increment: 1 },
          lastClicked: new Date(),
        },
      }),

      workspaceId
        ? prisma.project.update({
            where: { id: workspaceId },
            data: {
              usage: { increment: 1 },
              totalClicks: { increment: 1 },
            },
          })
        : null,

      logger.flush(),
    ]);
  }
};
