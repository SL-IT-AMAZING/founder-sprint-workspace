"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { createComment, updateComment, deleteComment, toggleLike, updatePost, deletePost, pinPost, hidePost } from "@/actions/feed";
import { formatRelativeTime } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  profileImage: string | null;
  role?: string | null;
}

interface PostImage {
  id: string;
  imageUrl: string;
}

interface Reply {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: User;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: User;
  replies: Reply[];
}

interface Like {
  id: string;
  user: User;
}

interface Post {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: Date;
  author: User;
  images: PostImage[];
  comments: Comment[];
  likes: Like[];
}

interface PostDetailProps {
  post: Post;
  currentUser: User;
}

export function PostDetail({ post, currentUser }: PostDetailProps) {
  const router = useRouter();
  const [commentContent, setCommentContent] = useState("");
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [showReplyForm, setShowReplyForm] = useState<Set<string>>(new Set());
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editingPost, setEditingPost] = useState(false);
  const [editPostContent, setEditPostContent] = useState(post.content);

  const isAdmin = currentUser.role === "super_admin" || currentUser.role === "admin";
  const isOwner = post.author.id === currentUser.id;

  const userHasLiked = post.likes.some((like) => like.user.id === currentUser.id);

  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    startTransition(async () => {
      const result = await createComment(post.id, commentContent);
      if (result.success) {
        setCommentContent("");
      }
    });
  };

  const handleAddReply = async (commentId: string) => {
    const content = replyContent[commentId];
    if (!content?.trim()) return;

    startTransition(async () => {
      const result = await createComment(post.id, content, commentId);
      if (result.success) {
        setReplyContent({ ...replyContent, [commentId]: "" });
        setShowReplyForm((prev) => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
      }
    });
  };

  const handleToggleLike = async () => {
    startTransition(async () => {
      await toggleLike("post", post.id);
    });
  };

  const toggleReplyForm = (commentId: string) => {
    setShowReplyForm((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    startTransition(async () => {
      const result = await updateComment(commentId, editContent);
      if (result.success) {
        setEditingCommentId(null);
        setEditContent("");
      }
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    startTransition(async () => {
      await deleteComment(commentId);
    });
  };

  const isEdited = (createdAt: Date, updatedAt: Date) => {
    return new Date(updatedAt).getTime() > new Date(createdAt).getTime() + 1000;
  };

  const handleEditPost = async () => {
    if (!editPostContent.trim()) return;
    
    const formData = new FormData();
    formData.append("content", editPostContent);
    
    startTransition(async () => {
      const result = await updatePost(post.id, formData);
      if (result.success) {
        setEditingPost(false);
      } else {
        alert(result.error);
      }
    });
  };

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    
    startTransition(async () => {
      const result = await deletePost(post.id);
      if (result.success) {
        router.push("/feed");
      } else {
        alert(result.error);
      }
    });
  };

  const handlePinPost = async () => {
    startTransition(async () => {
      const result = await pinPost(post.id);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const handleHidePost = async () => {
    startTransition(async () => {
      const result = await hidePost(post.id);
      if (result.success) {
        router.push("/feed");
      } else {
        alert(result.error);
      }
    });
  };

  const postMenuItems = (() => {
    const items = [];
    
    if (isOwner || isAdmin) {
      items.push({
        label: "Edit",
        onClick: () => setEditingPost(true),
      });
      items.push({
        label: "Delete",
        onClick: handleDeletePost,
        variant: "danger" as const,
      });
    }
    
    if (isAdmin) {
      items.push({
        label: post.isPinned ? "Unpin" : "Pin",
        onClick: handlePinPost,
      });
      items.push({
        label: "Hide",
        onClick: handleHidePost,
      });
    }
    
    return items;
  })();

  return (
    <div className="space-y-6">
      <Link href="/feed" className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
        <span>←</span>
        <span>Back to Feed</span>
      </Link>

      {/* Post */}
      <div
        className="card"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e0e0e0"
        }}
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Avatar
                src={post.author.profileImage}
                name={post.author.name}
                size={48}
              />
              <div>
                <p style={{ fontWeight: 600 }}>{post.author.name}</p>
                <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                  {formatRelativeTime(post.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {post.isPinned && <Badge variant="warning">Pinned</Badge>}
              {(isOwner || isAdmin) && postMenuItems.length > 0 && (
                <DropdownMenu items={postMenuItems} />
              )}
            </div>
          </div>

          {/* Post Content */}
          <p style={{ whiteSpace: "pre-wrap", fontSize: "1.125rem", lineHeight: 1.6 }}>{post.content}</p>

          {/* Post Images */}
          {post.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.images.map((image) => (
                <div
                  key={image.id}
                  className="aspect-video rounded-lg"
                  style={{ backgroundColor: "var(--color-card-border)" }}
                >
                  {/* Image placeholder */}
                </div>
              ))}
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center gap-4 pt-2 border-t" style={{ borderColor: "#e0e0e0" }}>
            <button
              onClick={handleToggleLike}
              className="text-sm font-medium"
              style={{
                background: userHasLiked ? "rgba(85,90,185,0.1)" : "none",
                border: "none",
                color: userHasLiked ? "#555AB9" : "#666666",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "4px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!userHasLiked) {
                  e.currentTarget.style.color = "#555AB9";
                  e.currentTarget.style.backgroundColor = "rgba(85,90,185,0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!userHasLiked) {
                  e.currentTarget.style.color = "#666666";
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {userHasLiked ? "★" : "☆"} {post.likes.length} likes
            </button>
            <span className="text-sm" style={{ color: "#666666" }}>
              {post.comments.length} comments
            </span>
          </div>
        </div>
      </div>

      <Modal
        open={editingPost}
        onClose={() => {
          setEditingPost(false);
          setEditPostContent(post.content);
        }}
        title="Edit Post"
      >
        <div className="space-y-4">
          <Textarea
            value={editPostContent}
            onChange={(e) => setEditPostContent(e.target.value)}
            rows={5}
            placeholder="What's on your mind?"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEditingPost(false);
                setEditPostContent(post.content);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditPost}
              loading={isPending}
              disabled={!editPostContent.trim()}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Comments ({post.comments.length})</h3>

        {/* New Comment Form */}
        <div
          className="card"
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #e0e0e0"
          }}
        >
          <form onSubmit={handleAddComment} className="space-y-3">
            <div className="flex items-start gap-3">
              <Avatar
                src={currentUser.profileImage}
                name={currentUser.name}
                size={40}
              />
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Write a comment..."
                  rows={3}
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={isPending}
                    disabled={!commentContent.trim()}
                  >
                    Add Comment
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Comments List */}
        {post.comments.length === 0 ? (
          <div
            className="card text-center py-8"
            style={{
              color: "var(--color-foreground-secondary)",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              border: "1px solid #e0e0e0"
            }}
          >
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-4">
            {post.comments.map((comment) => (
              <div
                key={comment.id}
                className="card"
                style={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  border: "1px solid #e0e0e0"
                }}
              >
                <div className="space-y-3">
                  {/* Comment Header */}
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={comment.author.profileImage}
                      name={comment.author.name}
                      size={40}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p style={{ fontWeight: 600 }}>{comment.author.name}</p>
                          <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                            {formatRelativeTime(comment.createdAt)}
                            {isEdited(comment.createdAt, comment.updatedAt) && (
                              <span style={{ marginLeft: "8px", fontStyle: "italic" }}>(edited)</span>
                            )}
                          </p>
                        </div>
                        {(comment.author.id === currentUser.id || isAdmin) && (
                          <div className="flex items-center gap-2">
                            {comment.author.id === currentUser.id && (
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditContent(comment.content);
                                }}
                                className="text-xs"
                                style={{ color: "var(--color-foreground-muted)", background: "none", border: "none", cursor: "pointer" }}
                              >
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-xs"
                              style={{ color: "var(--color-error)", background: "none", border: "none", cursor: "pointer" }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comment Content */}
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditContent("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEditComment(comment.id)}
                          loading={isPending}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ whiteSpace: "pre-wrap" }}>{comment.content}</p>
                  )}

                  {/* Reply Button */}
                  <button
                    onClick={() => toggleReplyForm(comment.id)}
                    className="text-sm"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#666666",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#555AB9";
                      e.currentTarget.style.backgroundColor = "rgba(85,90,185,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#666666";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Reply ({comment.replies.length})
                  </button>

                  {/* Reply Form */}
                  {showReplyForm.has(comment.id) && (
                    <div className="flex items-start gap-3 pt-3 border-t" style={{ borderColor: "#e0e0e0" }}>
                      <Avatar
                        src={currentUser.profileImage}
                        name={currentUser.name}
                        size={32}
                      />
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Write a reply..."
                          rows={2}
                          value={replyContent[comment.id] || ""}
                          onChange={(e) =>
                            setReplyContent({ ...replyContent, [comment.id]: e.target.value })
                          }
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => toggleReplyForm(comment.id)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddReply(comment.id)}
                            disabled={!replyContent[comment.id]?.trim()}
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="space-y-3 pt-3 border-t" style={{ borderColor: "#e0e0e0", marginLeft: "3rem" }}>
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <Avatar
                            src={reply.author.profileImage}
                            name={reply.author.name}
                            size={32}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm" style={{ fontWeight: 600 }}>{reply.author.name}</p>
                                <p className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                                  {formatRelativeTime(reply.createdAt)}
                                  {isEdited(reply.createdAt, reply.updatedAt) && (
                                    <span style={{ marginLeft: "4px", fontStyle: "italic" }}>(edited)</span>
                                  )}
                                </p>
                              </div>
                              {(reply.author.id === currentUser.id || isAdmin) && (
                                <div className="flex items-center gap-2">
                                  {reply.author.id === currentUser.id && (
                                    <button
                                      onClick={() => {
                                        setEditingCommentId(reply.id);
                                        setEditContent(reply.content);
                                      }}
                                      className="text-xs"
                                      style={{ color: "var(--color-foreground-muted)", background: "none", border: "none", cursor: "pointer" }}
                                    >
                                      Edit
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="text-xs"
                                    style={{ color: "var(--color-error)", background: "none", border: "none", cursor: "pointer" }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                            {editingCommentId === reply.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  rows={2}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingCommentId(null);
                                      setEditContent("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleEditComment(reply.id)}
                                    loading={isPending}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>{reply.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
