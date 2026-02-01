"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createPost, createComment, toggleLike } from "@/actions/feed";
import { formatRelativeTime, getInitials } from "@/lib/utils";

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
  currentUser: User;
}

export function FeedView({ posts, currentUser }: FeedViewProps) {
  const [postContent, setPostContent] = useState("");
  const [commentContent, setCommentContent] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Feed</h1>

      {/* Post Creation Form */}
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

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="Be the first to share something with your batch!"
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
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
                {/* Post Header */}
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
                  {post.isPinned && <Badge variant="warning">Pinned</Badge>}
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
                      e.currentTarget.style.color = "#555AB9";
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
                      e.currentTarget.style.color = "#555AB9";
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
    </div>
  );
}
