"use client";

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";

import { createPost, toggleLike, restorePost, updatePost, deletePost, pinPost, hidePost } from "@/actions/feed";
import { formatRelativeTime, getDisplayName } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { PostCard, InlineComposer, FeedTabs, defaultTabs } from "@/components/bookface";
import { useViewTracking } from "@/hooks/useViewTracking";
import { bookmarkPost, unbookmarkPost } from "@/actions/bookmark";
import { Avatar } from "@/components/ui/Avatar";
import { PostImageGrid } from "@/components/feed/PostImageGrid";
import { uploadPostImages } from "@/lib/post-image-upload";

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
  mentions?: Array<{
    id: string;
    mentionedUserId: string;
    displayText: string;
    startIndex: number;
    endIndex: number;
    isAccessible: boolean;
  }>;
  batch?: { name: string } | null;
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
  initialTab?: string;
  likedPostIds: string[];
  bookmarkedPostIds: string[];
}

export function FeedView({ posts, archivedPosts = [], currentUser, isAdmin = false, initialTab, likedPostIds, bookmarkedPostIds }: FeedViewProps) {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || 'top');
  const [isPending, startTransition] = useTransition();
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const toast = useToast();
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { createObserver } = useViewTracking();

  const [likedIds, setLikedIds] = useState<Set<string>>(new Set(likedPostIds));
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set(bookmarkedPostIds));
  const serverLikedIds = useMemo(() => new Set(likedPostIds), [likedPostIds]);

  useEffect(() => {
    setLikedIds(new Set(likedPostIds));
  }, [likedPostIds]);

  useEffect(() => {
    setBookmarkedIds(new Set(bookmarkedPostIds));
  }, [bookmarkedPostIds]);

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
        return posts.filter((post) => post.category === activeTab);
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

  const handleToggleLike = async (postId: string) => {
    const wasLiked = likedIds.has(postId);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
    startTransition(async () => {
      const result = await toggleLike("post", postId);
      if (!result.success) {
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) {
            next.add(postId);
          } else {
            next.delete(postId);
          }
          return next;
        });
        toast.error(result.error);
      }
    });
  };

  const handleBookmark = async (postId: string) => {
    const wasBookmarked = bookmarkedIds.has(postId);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
    startTransition(async () => {
      if (wasBookmarked) {
        await unbookmarkPost(postId);
      } else {
        await bookmarkPost(postId);
      }
    });
  };

  const handleShare = async (postId: string) => {
    const url = `${window.location.origin}/feed/${postId}`;

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

      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
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

  const getPostMenuItems = (post: Post) => {
    const items = [];
    const isOwner = post.author.id === currentUser.id;

    if (isOwner || isAdmin) {
      if ((post.mentions?.length || 0) === 0) {
        items.push({
          label: "Edit",
          onClick: () => {
            setEditingPost(post);
            setEditContent(post.content);
          },
        });
      }
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
    <div className="space-y-5 md:space-y-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#8A8377',
              }}
            >
              Community
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                fontFamily: '"BDO Grotesk", sans-serif',
                color: '#2F2C26',
              }}
            >
              Feed
            </h1>
          </div>
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

        <InlineComposer
          currentUser={currentUser}
          onSubmit={async (data) => {
            try {
              setIsCreatingPost(true);
              const formData = new FormData();
              formData.append("content", data.content);
              if (data.category) formData.append("category", data.category);
              if (data.mentions.length > 0) {
                formData.append("mentions", JSON.stringify(data.mentions));
              }
              if (data.linkPreview) formData.append("linkPreview", JSON.stringify(data.linkPreview));
              if (data.files.length > 0) {
                const uploadResult = await uploadPostImages(data.files);
                if (!uploadResult.success) {
                  toast.error(uploadResult.error);
                  return { success: false, error: uploadResult.error };
                }
                formData.append("imagePaths", JSON.stringify(uploadResult.data));
              }
              const result = await createPost(formData);
              if (!result.success) {
                toast.error(result.error);
                return { success: false, error: result.error };
              }
              return { success: true };
            } finally {
              setIsCreatingPost(false);
            }
          }}
          isPending={isPending || isCreatingPost}
        />

        <FeedTabs
          tabs={defaultTabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {filteredPosts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="Be the first to share something with the community!"
        />
      ) : (
        <div className="space-y-3 md:space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              ref={(element) => {
                if (element) {
                  postRefs.current.set(post.id, element);
                } else {
                  postRefs.current.delete(post.id);
                }
              }}
              data-post-id={post.id}
            >
              {post.isPinned && (
                <div style={{ marginBottom: '10px', display: 'inline-flex' }}>
                  <Badge variant="warning">Pinned</Badge>
                </div>
              )}
              <PostCard
                id={post.id}
                author={{
                  name: getDisplayName(post.author),
                  avatarUrl: post.author.profileImage || undefined,
                  batch: post.batch?.name || undefined,
                  company: undefined,
                }}
                content={post.content}
                images={post.images}
                postedAt={formatRelativeTime(post.createdAt)}
                likes={post._count.likes + (likedIds.has(post.id) ? 1 : 0) - (serverLikedIds.has(post.id) ? 1 : 0)}
                comments={post._count.comments}
                views={post.viewCount}
                isLiked={likedIds.has(post.id)}
                isBookmarked={bookmarkedIds.has(post.id)}
                onLike={() => handleToggleLike(post.id)}
                onComment={() => router.push(`/feed/${post.id}`)}
                onBookmark={() => handleBookmark(post.id)}
                onShare={() => handleShare(post.id)}
                onAuthorClick={() => router.push(`/profile/${post.author.id}`)}
                menuItems={(post.author.id === currentUser.id || isAdmin) ? getPostMenuItems(post) : undefined}
                mentions={post.mentions}
                variant="feed"
              />
            </div>
          ))}
        </div>
      )}

      {isAdmin && showArchived && archivedPosts.length > 0 && (
        <div className="mt-10 space-y-4">
          <h2 className="text-xl font-medium" style={{ color: "var(--color-foreground-secondary)" }}>
            Archived Posts ({archivedPosts.length})
          </h2>
          {archivedPosts.map((post) => (
            <div
              key={post.id}
              className="card"
              style={{
                backgroundColor: "#FCFBF8",
                borderRadius: "12px",
                border: "1px solid #E8E1D4",
                opacity: 0.85,
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
                <PostImageGrid images={post.images} />
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
            onChange={(event) => setEditContent(event.target.value)}
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
