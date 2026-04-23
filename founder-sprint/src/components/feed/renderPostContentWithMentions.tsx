import Link from "next/link";
import type { ReactNode } from "react";

export interface RenderablePostMention {
  id: string;
  mentionedUserId: string;
  displayText: string;
  startIndex: number;
  endIndex: number;
  isAccessible: boolean;
}

export function renderPostContentWithMentions(
  content: string,
  mentions: RenderablePostMention[],
  options: {
    truncateAt?: number;
    disableLinks?: boolean;
  } = {}
): ReactNode {
  const { truncateAt, disableLinks = false } = options;
  const truncated = typeof truncateAt === "number" && content.length > truncateAt;
  const visibleContent = truncated ? `${content.slice(0, truncateAt)}...` : content;
  const visibleMentions = truncated
    ? mentions.filter((mention) => mention.endIndex <= truncateAt)
    : mentions;

  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const mention of visibleMentions) {
    if (mention.startIndex > cursor) {
      nodes.push(visibleContent.slice(cursor, mention.startIndex));
    }

    const mentionText = visibleContent.slice(mention.startIndex, mention.endIndex);
    if (mention.isAccessible && !disableLinks) {
      nodes.push(
        <Link
          key={mention.id}
          href={`/profile/${mention.mentionedUserId}`}
          style={{
            color: "var(--color-primary)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          {mentionText}
        </Link>
      );
    } else {
      nodes.push(mentionText);
    }

    cursor = mention.endIndex;
  }

  if (cursor < visibleContent.length) {
    nodes.push(visibleContent.slice(cursor));
  }

  return nodes;
}
