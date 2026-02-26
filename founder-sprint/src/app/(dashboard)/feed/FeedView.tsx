"use client";

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";

import { createPost, createComment, toggleLike, restorePost, updatePost, deletePost, pinPost, hidePost } from "@/actions/feed";
import { formatRelativeTime, getDisplayName } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { PostCard, InlineComposer, FeedTabs, defaultTabs } from "@/components/bookface";
import { useViewTracking } from "@/hooks/useViewTracking";
import { bookmarkPost, unbookmarkPost } from "@/actions/bookmark";

interface User {
  id: string;
  name: string | null;
  email: string;
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
  category?: string | null;
  viewCount: number;
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
  initialTab?: string;
  batchName?: string;
}

export function FeedView({ posts, archivedPosts = [], currentUser, isAdmin = false, readOnly = false, initialTab, batchName }: FeedViewProps) {
  const [commentContent, setCommentContent] = useState<Record<string, string>>({});
  const router = useRouter();
  const [showComments, setShowComments] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || 'top');
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { createObserver } = useViewTracking();

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`/feed?tab=${tabId}`, { scroll: false });
  };

  const filteredPosts = useMemo(() => {
    switch (activeTab) {
      case 'top':
        return [...posts].sort((a, b) => b._count.likes - a._count.likes);
      case 'recent':
        return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'general':
      case 'launch':
      case 'classifieds':
      case 'recruiting':
        return posts.filter((p) => p.category === activeTab);
      default:
        return posts;
    }
  }, [posts, activeTab]);

  useEffect(() => {
    const observer = createObserver();
    if (!observer) return;

    postRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [filteredPosts, createObserver]);


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
        toast.error(result.error);
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
        toast.error(result.error);
      }
    });
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    
    startTransition(async () => {
      const result = await deletePost(postId);
      if (!result.success) {
        toast.error(result.error);
      }
    });
  };

  const handlePinPost = async (postId: string) => {
    startTransition(async () => {
      const result = await pinPost(postId);
      if (!result.success) {
        toast.error(result.error);
      }
    });
  };

  const handleHidePost = async (postId: string) => {
    startTransition(async () => {
      const result = await hidePost(postId);
      if (!result.success) {
        toast.error(result.error);
      }
    });
  };

  const handleBookmark = async (postId: string, isBookmarked: boolean) => {
    startTransition(async () => {
      if (isBookmarked) {
        await unbookmarkPost(postId);
      } else {
        await bookmarkPost(postId);
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
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Feed</h1>
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

      <FeedTabs
        tabs={defaultTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

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
        <InlineComposer
          currentUser={currentUser}
          onSubmit={async (data) => {
            const formData = new FormData();
            formData.append("content", data.content);
            if (data.category) formData.append("category", data.category);
            if (data.linkPreview) formData.append("linkPreview", JSON.stringify(data.linkPreview));
            const result = await createPost(formData);
            if (!result.success) {
              toast.error(result.error);
            }
          }}
          isPending={isPending}
        />
      )}

      {/* Posts Feed */}
      {filteredPosts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="Be the first to share something with your batch!"
        />
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              ref={(el) => {
                if (el) {
                  postRefs.current.set(post.id, el);
                } else {
                  postRefs.current.delete(post.id);
                }
              }}
              data-post-id={post.id}
            >
              {post.isPinned && (
                <div style={{ marginBottom: '12px' }}>
                  <Badge variant="warning">Pinned</Badge>
                </div>
              )}
              <PostCard
                id={post.id}
                author={{
                  name: getDisplayName(post.author),
                  avatarUrl: post.author.profileImage || undefined,
                  batch: batchName || undefined,
                  company: undefined,
                }}
                content={post.content}
                postedAt={formatRelativeTime(post.createdAt)}
                likes={post._count.likes}
                comments={post._count.comments}
                views={post.viewCount}
                isLiked={false}
                isBookmarked={false}
                onLike={() => handleToggleLike(post.id)}
                onComment={() => toggleCommentsView(post.id)}
                onBookmark={() => handleBookmark(post.id, false)}
                menuItems={(post.author.id === currentUser.id || isAdmin) ? getPostMenuItems(post) : undefined}
              />

              {showComments.has(post.id) && (
                <div className="space-y-3 pt-3 border-t" style={{ borderColor: "#e0e0e0" }}>
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={currentUser.profileImage}
                      name={getDisplayName(currentUser)}
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
                      name={getDisplayName(post.author)}
                    />
                    <div>
                      <p className="font-medium">{getDisplayName(post.author)}</p>
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
