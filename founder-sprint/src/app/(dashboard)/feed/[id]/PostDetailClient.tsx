"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { PostCard } from "@/components/bookface/PostCard";
import { createComment, toggleLike } from "@/actions/feed";
import { bookmarkPost, unbookmarkPost } from "@/actions/bookmark";
import { formatRelativeTime, getDisplayName, getInitials } from "@/lib/utils";
import type { RenderablePostMention } from "@/components/feed/renderPostContentWithMentions";
import { useToast } from "@/hooks/useToast";

interface PostComment {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; name: string | null; email: string; profileImage: string | null };
  likes: Array<{ userId: string }>;
  replies?: PostComment[];
}

interface PostDetail {
  id: string;
  content: string;
  category: string | null;
  viewCount: number;
  isPinned: boolean;
  createdAt: Date;
  author: { id: string; name: string | null; email: string; profileImage: string | null; headline: string | null };
  images: Array<{ id: string; imageUrl: string }>;
  mentions: RenderablePostMention[];
  comments: PostComment[];
  likes: Array<{ userId: string }>;
  bookmarks: Array<{ id: string }>;
  _count: { comments: number; likes: number };
  linkPreview?: unknown;
}

interface PostDetailClientProps {
  post: PostDetail;
  currentUser: { id: string; name: string | null; email: string; profileImage: string | null };
  isLiked: boolean;
  isBookmarked: boolean;
  participants: Array<{ id: string; name: string | null; email: string; profileImage: string | null }>;
}

const styles = {
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#1A1A1A',
    textDecoration: 'none',
    marginBottom: '16px',
    fontWeight: 500,
  },
  commentSection: {
    marginTop: '24px',
  },
  commentInputContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    flexShrink: 0,
  },
  avatarPlaceholder: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#1A1A1A',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    flexShrink: 0,
  },
  commentInputWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    lineHeight: '1.5',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    resize: 'vertical' as const,
    minHeight: '80px',
  },
  submitButton: {
    alignSelf: 'flex-end',
    padding: '8px 16px',
    backgroundColor: '#1A1A1A',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  submitButtonDisabled: {
    alignSelf: 'flex-end',
    padding: '8px 16px',
    backgroundColor: '#ccc',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'not-allowed',
  },
  commentList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  comment: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e0e0e0',
  },
  commentHeader: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthorName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1a1a',
  },
  commentTimestamp: {
    fontSize: '12px',
    color: '#666',
    marginTop: '2px',
  },
  commentContent: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#1a1a1a',
    marginBottom: '12px',
    whiteSpace: 'pre-wrap' as const,
  },
  commentActions: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#3F3D3A',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 2px',
    borderRadius: '999px',
    fontWeight: 600,
    lineHeight: 1,
    minHeight: '28px',
    transition: 'color 0.16s ease, transform 0.16s ease, opacity 0.16s ease',
  },
  actionButtonActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#1A1A1A',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 2px',
    borderRadius: '999px',
    fontWeight: 600,
    lineHeight: 1,
    minHeight: '28px',
    transition: 'color 0.16s ease, transform 0.16s ease, opacity 0.16s ease',
  },
  actionButtonDisabled: {
    cursor: 'default',
    opacity: 0.5,
  },
  repliesContainer: {
    marginTop: '16px',
    marginLeft: '32px',
    paddingLeft: '16px',
    borderLeft: '2px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  replyInputContainer: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#f8f8f8',
    borderRadius: '6px',
  },
  replyTextarea: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    lineHeight: '1.5',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    resize: 'vertical' as const,
    minHeight: '60px',
    backgroundColor: '#ffffff',
  },
  sidebar: {
    position: 'sticky' as const,
    top: '68px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    padding: '16px',
    height: 'fit-content',
  },
  sidebarTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '16px',
  },
  participantList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  participant: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  participantAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  participantAvatarPlaceholder: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#1A1A1A',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  participantName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1a1a',
  },
};

function HeartIcon({ filled = false, size = 20 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path
        d="M20.8 4.6c-2-2-5.2-1.9-7.1.2L12 6.5l-1.7-1.7C8.4 2.7 5.2 2.6 3.2 4.6c-2.2 2.2-2.1 5.8.2 8l8.6 8.1 8.6-8.1c2.3-2.2 2.4-5.8.2-8Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 11.6c0 4.2-3.6 7.6-8 7.6-1.1 0-2.1-.2-3.1-.6L4 20l1.3-4.1A7.1 7.1 0 0 1 4 11.6C4 7.4 7.6 4 12 4s8 3.4 8 7.6Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PostDetailClient({
  post,
  currentUser,
  isLiked: initialIsLiked,
  isBookmarked: initialIsBookmarked,
  participants,
}: PostDetailClientProps) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [commentInput, setCommentInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>(() => {
    const likes: Record<string, boolean> = {};
    post.comments.forEach((comment) => {
      likes[comment.id] = comment.likes.some((like) => like.userId === currentUser.id);
      comment.replies?.forEach((reply) => {
        likes[reply.id] = reply.likes.some((like) => like.userId === currentUser.id);
      });
    });
    return likes;
  });
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    post.comments.forEach((comment) => {
      counts[comment.id] = comment.likes.length;
      comment.replies?.forEach((reply) => {
        counts[reply.id] = reply.likes.length;
      });
    });
    return counts;
  });
  const commentSectionRef = useRef<HTMLDivElement | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const shareCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shareCopiedTimerRef.current) clearTimeout(shareCopiedTimerRef.current);
    };
  }, []);

  const handlePostLike = () => {
    const nextIsLiked = !isLiked;
    setIsLiked(nextIsLiked);
    setLikeCount((prev) => Math.max(0, prev + (nextIsLiked ? 1 : -1)));

    startTransition(async () => {
      const result = await toggleLike("post", post.id);
      if (!result.success) {
        setIsLiked(!nextIsLiked);
        setLikeCount((prev) => Math.max(0, prev + (nextIsLiked ? -1 : 1)));
        toast.error(result.error);
      }
    });
  };

  const handlePostBookmark = () => {
    const nextIsBookmarked = !isBookmarked;
    setIsBookmarked(nextIsBookmarked);

    startTransition(async () => {
      const result = nextIsBookmarked
        ? await bookmarkPost(post.id)
        : await unbookmarkPost(post.id);

      if (!result.success) {
        setIsBookmarked(!nextIsBookmarked);
        toast.error(result.error);
      }
    });
  };

  const handlePostCommentClick = () => {
    commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => commentInputRef.current?.focus(), 250);
  };

  const handlePostShare = async () => {
    const url = `${window.location.origin}/feed/${post.id}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();

        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (!copied) {
          throw new Error("Clipboard copy command failed");
        }
      }

      setIsShareCopied(true);
      toast.success("Link copied to clipboard");
      if (shareCopiedTimerRef.current) clearTimeout(shareCopiedTimerRef.current);
      shareCopiedTimerRef.current = setTimeout(() => {
        setIsShareCopied(false);
      }, 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleCommentSubmit = () => {
    if (!commentInput.trim()) return;
    startTransition(async () => {
      await createComment(post.id, commentInput.trim());
      setCommentInput("");
      window.location.reload();
    });
  };

  const handleReplySubmit = (parentId: string) => {
    if (!replyInput.trim()) return;
    startTransition(async () => {
      await createComment(post.id, replyInput.trim(), parentId);
      setReplyInput("");
      setReplyingTo(null);
      window.location.reload();
    });
  };

  const handleCommentLike = (commentId: string) => {
    const wasLiked = commentLikes[commentId] || false;
    const nextIsLiked = !wasLiked;
    setCommentLikes((prev) => ({ ...prev, [commentId]: nextIsLiked }));
    setCommentLikeCounts((prev) => ({
      ...prev,
      [commentId]: Math.max(0, (prev[commentId] ?? 0) + (nextIsLiked ? 1 : -1)),
    }));

    startTransition(async () => {
      const result = await toggleLike("comment", undefined, commentId);
      if (!result.success) {
        setCommentLikes((prev) => ({ ...prev, [commentId]: wasLiked }));
        setCommentLikeCounts((prev) => ({
          ...prev,
          [commentId]: Math.max(0, (prev[commentId] ?? 0) + (nextIsLiked ? -1 : 1)),
        }));
        toast.error(result.error);
      }
    });
  };

  const renderComment = (comment: PostComment, isReply: boolean = false) => {
    const isLikedByUser = commentLikes[comment.id] || false;
    const likeCount = commentLikeCounts[comment.id] ?? comment.likes.length;
    const likeButtonStyle = {
      ...(isLikedByUser ? styles.actionButtonActive : styles.actionButton),
      ...(isPending ? styles.actionButtonDisabled : {}),
    };

    return (
      <div key={comment.id}>
        <div style={styles.comment}>
          <div style={styles.commentHeader}>
            {comment.author.profileImage ? (
              <img
                src={comment.author.profileImage}
                alt={getDisplayName(comment.author)}
                style={styles.avatar}
              />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {getInitials(getDisplayName(comment.author))}
              </div>
            )}
            <div style={styles.commentInfo}>
              <div style={styles.commentAuthorName}>{getDisplayName(comment.author)}</div>
              <div style={styles.commentTimestamp}>
                {formatRelativeTime(comment.createdAt)}
              </div>
            </div>
          </div>
          <div style={styles.commentContent}>{comment.content}</div>
          <div style={styles.commentActions}>
            <button
              type="button"
              style={likeButtonStyle}
              onClick={() => handleCommentLike(comment.id)}
              disabled={isPending}
              aria-label={isLikedByUser ? "Unlike comment" : "Like comment"}
            >
              <HeartIcon filled={isLikedByUser} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            {!isReply && (
              <button
                type="button"
                style={styles.actionButton}
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <CommentIcon />
                Reply
              </button>
            )}
          </div>
          {replyingTo === comment.id && (
            <div style={styles.replyInputContainer}>
              {currentUser.profileImage ? (
                <img
                  src={currentUser.profileImage}
                  alt={getDisplayName(currentUser)}
                  style={styles.avatar}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {getInitials(getDisplayName(currentUser))}
                </div>
              )}
              <div style={styles.commentInputWrapper}>
                <textarea
                  style={styles.replyTextarea}
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder="Write a reply..."
                  disabled={isPending}
                />
                <button
                  style={!replyInput.trim() || isPending ? styles.submitButtonDisabled : styles.submitButton}
                  onClick={() => handleReplySubmit(comment.id)}
                  disabled={!replyInput.trim() || isPending}
                >
                  {isPending ? "Posting..." : "Reply"}
                </button>
              </div>
            </div>
          )}
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div style={styles.repliesContainer}>
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div>
        <Link href="/feed" style={styles.backLink}>
          ← Back to Feed
        </Link>

        <PostCard
          id={post.id}
          author={{
            name: getDisplayName(post.author),
            avatarUrl: post.author.profileImage || undefined,
            company: post.author.headline || undefined,
          }}
          content={post.content}
          mentions={post.mentions}
          images={post.images}
          linkPreview={post.linkPreview as { url: string; title: string; description?: string; imageUrl?: string; domain: string } | undefined}
          postedAt={formatRelativeTime(post.createdAt)}
          likes={likeCount}
          comments={post._count.comments}
          views={post.viewCount}
          isLiked={isLiked}
          isBookmarked={isBookmarked}
          isShareCopied={isShareCopied}
          onLike={handlePostLike}
          onComment={handlePostCommentClick}
          onBookmark={handlePostBookmark}
          onShare={handlePostShare}
        />

        <div ref={commentSectionRef} style={styles.commentSection}>
          <div style={styles.commentInputContainer}>
            {currentUser.profileImage ? (
              <img
                src={currentUser.profileImage}
                alt={getDisplayName(currentUser)}
                style={styles.avatar}
              />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {getInitials(getDisplayName(currentUser))}
              </div>
            )}
            <div style={styles.commentInputWrapper}>
              <textarea
                ref={commentInputRef}
                style={styles.textarea}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a comment..."
                disabled={isPending}
              />
              <button
                style={!commentInput.trim() || isPending ? styles.submitButtonDisabled : styles.submitButton}
                onClick={handleCommentSubmit}
                disabled={!commentInput.trim() || isPending}
              >
                {isPending ? "Posting..." : "Comment"}
              </button>
            </div>
          </div>

          <div style={styles.commentList}>
            {post.comments.map((comment) => renderComment(comment))}
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <div style={styles.sidebar}>
          <div style={styles.sidebarTitle}>In This Conversation</div>
          <div style={styles.participantList}>
            {participants.map((participant) => (
              <div key={participant.id} style={styles.participant}>
                {participant.profileImage ? (
                  <img
                    src={participant.profileImage}
                    alt={getDisplayName(participant)}
                    style={styles.participantAvatar}
                  />
                ) : (
                  <div style={styles.participantAvatarPlaceholder}>
                    {getInitials(getDisplayName(participant))}
                  </div>
                )}
                <div style={styles.participantName}>{getDisplayName(participant)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
