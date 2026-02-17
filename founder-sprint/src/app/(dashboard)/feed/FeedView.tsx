"use client";

import { useState, useTransition, useMemo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { createPost, createComment, toggleLike, restorePost, updatePost, deletePost, pinPost, hidePost } from "@/actions/feed";
import { formatRelativeTime } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  profileImage: string | null;
}

interface PostImage {
  id: string;
  imageUrl: string;
}

interface Post {
  id: string;
  content: string;
  isPinned: boolean;
  isHidden?: boolean;
  batchId?: string;
  createdAt: Date;
  author: User;
  images: PostImage[];
  _count: {
    comments: number;
    likes: number;
  };
}

interface FeedViewProps {
  posts: Post[];
  archivedPosts?: Post[];
  currentUser: User;
  isAdmin?: boolean;
  readOnly?: boolean;
}

type FeedFilter = "all" | "latest" | "pinned";

export function FeedView({ posts, archivedPosts = [], currentUser, isAdmin = false, readOnly = false }: FeedViewProps) {
  const [postContent, setPostContent] = useState("");
  const [commentContent, setCommentContent] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");

  const filteredPosts = useMemo(() => {
    switch (feedFilter) {
      case "latest":
        return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "pinned":
        return posts.filter((p) => p.isPinned);
      default:
        return posts;
    }
  }, [posts, feedFilter]);

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setError("");

    const formData = new FormData();
    formData.append("content", postContent);

    startTransition(async () => {
      const result = await createPost(formData);
      if (result.success) {
        setPostContent("");
      } else {
        setError(result.error);
      }
    });
  };

  const handleAddComment = async (postId: string) => {
    const content = commentContent[postId];
    if (!content?.trim()) return;

    startTransition(async () => {
      const result = await createComment(postId, content);
      if (result.success) {
        setCommentContent({ ...commentContent, [postId]: "" });
      }
    });
  };

  const handleToggleLike = async (postId: string) => {
    startTransition(async () => {
      await toggleLike("post", postId);
    });
  };

  const toggleCommentsView = (postId: string) => {
    const newShow = new Set(showComments);
    if (newShow.has(postId)) {
      newShow.delete(postId);
    } else {
      newShow.add(postId);
    }
    setShowComments(newShow);
  };

  const handleRestore = async (postId: string) => {
    startTransition(async () => {
      const result = await restorePost(postId);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const handleEditPost = async () => {
    if (!editingPost || !editContent.trim()) return;
    
    const formData = new FormData();
    formData.append("content", editContent);
    
    startTransition(async () => {
      const result = await updatePost(editingPost.id, formData);
      if (result.success) {
        setEditingPost(null);
        setEditContent("");
      } else {
        alert(result.error);
      }
    });
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    
    startTransition(async () => {
      const result = await deletePost(postId);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const handlePinPost = async (postId: string) => {
    startTransition(async () => {
      const result = await pinPost(postId);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const handleHidePost = async (postId: string) => {
    startTransition(async () => {
      const result = await hidePost(postId);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const getPostMenuItems = (post: Post) => {
    const items = [];
    const isOwner = post.author.id === currentUser.id;
    
    if (isOwner || isAdmin) {
      items.push({
        label: "Edit",
        onClick: () => {
          setEditingPost(post);
          setEditContent(post.content);
        },
      });
      items.push({
        label: "Delete",
        onClick: () => handleDeletePost(post.id),
        variant: "danger" as const,
      });
    }
    
    if (isAdmin) {
      items.push({
        label: post.isPinned ? "Unpin" : "Pin",
        onClick: () => handlePinPost(post.id),
      });
      items.push({
        label: "Hide",
        onClick: () => handleHidePost(post.id),
      });
    }
    
    return items;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Feed</h1>
        {isAdmin && archivedPosts.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? "Hide Archived" : `Show Archived (${archivedPosts.length})`}
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {(["all", "latest", "pinned"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setFeedFilter(filter)}
            className={feedFilter === filter ? "btn btn-primary" : "btn btn-secondary"}
            style={{ fontSize: 14, height: 36, padding: "0 16px" }}
          >
            {filter === "all" ? "All" : filter === "latest" ? "Latest" : "Pinned"}
          </button>
        ))}
      </div>

      {/* Post Creation Form */}
      {readOnly ? (
        <div
          className="card text-center text-sm"
          style={{
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
            padding: "16px",
            color: "var(--color-foreground-secondary)",
          }}
        >
          This batch has ended. New posts cannot be created.
        </div>
      ) : (
        <div
          className="card"
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #e0e0e0"
          }}
        >
          <form onSubmit={handleCreatePost} className="space-y-3">
            {error && (
              <div className="form-error p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex items-start gap-3">
              <Avatar
                src={currentUser.profileImage}
                name={currentUser.name}
              />
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="What's on your mind?"
                  rows={3}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button type="submit" loading={isPending} disabled={!postContent.trim()}>
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Posts Feed */}
      {filteredPosts.length === 0 ? (
        <EmptyState
          title={feedFilter === "pinned" ? "No pinned posts" : "No posts yet"}
          description={feedFilter === "pinned" ? "No announcements at the moment" : "Be the first to share something with your batch!"}
        />
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
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
                    />
                    <div>
                      <p className="font-medium">{post.author.name}</p>
                      <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                        {formatRelativeTime(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.isPinned && <Badge variant="warning">Pinned</Badge>}
                    {(post.author.id === currentUser.id || isAdmin) && (
                      <DropdownMenu items={getPostMenuItems(post)} />
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <p style={{ whiteSpace: "pre-wrap" }}>{post.content}</p>

                {/* Post Images Placeholder */}
                {post.images.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    onClick={() => handleToggleLike(post.id)}
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
                      e.currentTarget.style.color = "#1A1A1A";
                      e.currentTarget.style.backgroundColor = "rgba(85,90,185,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#666666";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {post._count.likes} likes
                  </button>
                  <button
                    onClick={() => toggleCommentsView(post.id)}
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
                      e.currentTarget.style.color = "#1A1A1A";
                      e.currentTarget.style.backgroundColor = "rgba(85,90,185,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#666666";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {post._count.comments} comments
                  </button>
                </div>

                {/* Comments Section */}
                {showComments.has(post.id) && (
                  <div className="space-y-3 pt-3 border-t" style={{ borderColor: "#e0e0e0" }}>
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={currentUser.profileImage}
                        name={currentUser.name}
                        size={32}
                      />
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Write a comment..."
                          rows={2}
                          value={commentContent[post.id] || ""}
                          onChange={(e) =>
                            setCommentContent({ ...commentContent, [post.id]: e.target.value })
                          }
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentContent[post.id]?.trim()}
                          >
                            Comment
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && showArchived && archivedPosts.length > 0 && (
        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-medium" style={{ color: "var(--color-foreground-secondary)" }}>
            Archived Posts ({archivedPosts.length})
          </h2>
          {archivedPosts.map((post) => (
            <div
              key={post.id}
              className="card"
              style={{
                backgroundColor: "#f9f9f9",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                border: "1px solid #e0e0e0",
                opacity: 0.8,
              }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={post.author.profileImage}
                      name={post.author.name}
                    />
                    <div>
                      <p className="font-medium">{post.author.name}</p>
                      <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                        {formatRelativeTime(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="error">Archived</Badge>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRestore(post.id)}
                      disabled={isPending}
                    >
                      Restore
                    </Button>
                  </div>
                </div>
                <p style={{ whiteSpace: "pre-wrap" }}>{post.content}</p>
                <div className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                  {post._count.likes} likes · {post._count.comments} comments
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!editingPost}
        onClose={() => {
          setEditingPost(null);
          setEditContent("");
        }}
        title="Edit Post"
      >
        <div className="space-y-4">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={5}
            placeholder="What's on your mind?"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEditingPost(null);
                setEditContent("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditPost}
              loading={isPending}
              disabled={!editContent.trim()}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
