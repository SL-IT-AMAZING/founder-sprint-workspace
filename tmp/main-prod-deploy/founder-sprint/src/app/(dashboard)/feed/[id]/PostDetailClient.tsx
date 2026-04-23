"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { PostCard } from "@/components/bookface/PostCard";
import { createComment, toggleLike } from "@/actions/feed";
import { bookmarkPost, unbookmarkPost } from "@/actions/bookmark";
import { formatRelativeTime, getDisplayName, getInitials } from "@/lib/utils";

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
  isAdmin: boolean;
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
    color: '#666',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
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
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
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

export function PostDetailClient({
  post,
  currentUser,
  isLiked: initialIsLiked,
  isBookmarked: initialIsBookmarked,
  isAdmin,
  participants,
}: PostDetailClientProps) {
  const [isPending, startTransition] = useTransition();
  const [commentInput, setCommentInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
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

  const handlePostLike = () => {
    startTransition(async () => {
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikeCount((prev) => (newIsLiked ? prev + 1 : prev - 1));
      await toggleLike("post", post.id);
    });
  };

  const handlePostBookmark = () => {
    startTransition(async () => {
      const newIsBookmarked = !isBookmarked;
      setIsBookmarked(newIsBookmarked);
      if (newIsBookmarked) {
        await bookmarkPost(post.id);
      } else {
        await unbookmarkPost(post.id);
      }
    });
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
    startTransition(async () => {
      setCommentLikes((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
      await toggleLike("comment", undefined, commentId);
    });
  };

  const renderComment = (comment: PostComment, isReply: boolean = false) => {
    const isLikedByUser = commentLikes[comment.id] || false;
    const likeCount = comment.likes.length;

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
              style={isLikedByUser ? styles.actionButtonActive : styles.actionButton}
              onClick={() => handleCommentLike(comment.id)}
              disabled={isPending}
            >
              <span>{isLikedByUser ? "❤️" : "🤍"}</span>
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            {!isReply && (
              <button
                style={styles.actionButton}
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
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
          linkPreview={post.linkPreview as { url: string; title: string; description?: string; imageUrl?: string; domain: string } | undefined}
          postedAt={formatRelativeTime(post.createdAt)}
          likes={likeCount}
          comments={post._count.comments}
          views={post.viewCount}
          isLiked={isLiked}
          isBookmarked={isBookmarked}
          onLike={handlePostLike}
          onBookmark={handlePostBookmark}
        />

        <div style={styles.commentSection}>
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
