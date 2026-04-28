"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { joinGroup, leaveGroup } from "@/actions/group";
import { createPost, toggleLike } from "@/actions/feed";
import { formatRelativeTime, getDisplayName } from "@/lib/utils";
import { MentionTextarea, type ComposerMention } from "@/components/feed/MentionTextarea";
import { renderPostContentWithMentions } from "@/components/feed/renderPostContentWithMentions";
import { PostImagePicker } from "@/components/feed/PostImagePicker";
import { PostImageGrid } from "@/components/feed/PostImageGrid";
import { uploadPostImages } from "@/lib/post-image-upload";

interface User {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
}

interface GroupMember {
  id: string;
  joinedAt: Date;
  user: User;
}

interface PostImage {
  id: string;
  imageUrl: string;
}

interface Post {
  id: string;
  content: string;
  imageDisplaySize?: string | null;
  isPinned: boolean;
  createdAt: Date;
  author: User;
  images: PostImage[];
  mentions: Array<{
    id: string;
    mentionedUserId: string;
    displayText: string;
    startIndex: number;
    endIndex: number;
    isAccessible: boolean;
  }>;
  _count: {
    comments: number;
    likes: number;
  };
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  members: GroupMember[];
  posts: Post[];
}

interface GroupDetailProps {
  group: Group;
  currentUserId: string;
  currentUser: User;
  isAdmin: boolean;
}

export function GroupDetail({ group, currentUserId, currentUser, isAdmin }: GroupDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [postContent, setPostContent] = useState("");
  const [mentions, setMentions] = useState<ComposerMention[]>([]);
  const [postImages, setPostImages] = useState<File[]>([]);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [error, setError] = useState("");

  const isMember = group.members.some((m) => m.user.id === currentUserId);

  const handleJoinLeave = async () => {
    startTransition(async () => {
      if (isMember) {
        await leaveGroup(group.id);
      } else {
        await joinGroup(group.id);
      }
    });
  };

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setError("");
    try {
      setIsSubmittingPost(true);

      const formData = new FormData();
      formData.append("content", postContent);
      formData.append("groupId", group.id);
      if (mentions.length > 0) {
        formData.append("mentions", JSON.stringify(mentions));
      }
      if (postImages.length > 0) {
        const uploadResult = await uploadPostImages(postImages);
        if (!uploadResult.success) {
          setError(uploadResult.error);
          return;
        }
        formData.append("imagePaths", JSON.stringify(uploadResult.data));
      }

      const result = await createPost(formData);
      if (result.success) {
        setPostContent("");
        setMentions([]);
        setPostImages([]);
      } else {
        setError(result.error);
      }
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    startTransition(async () => {
      await toggleLike("post", postId);
    });
  };

  return (
    <div className="space-y-6">
      {/* Group Header */}
      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl mb-2">{group.name}</h1>
            {group.description && (
              <p style={{ color: "var(--color-foreground-secondary)" }}>
                {group.description}
              </p>
            )}
            <div className="mt-3 flex items-center gap-4 text-sm" style={{ color: "var(--color-foreground-muted)" }}>
              <span>{group.members.length} members</span>
              <span>{group.posts.length} posts</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(isAdmin || isMember) && (
              <Link href={`/groups/${group.id}/manage`}>
                <Button variant="secondary" type="button">Manage</Button>
              </Link>
            )}
            <Button onClick={handleJoinLeave} loading={isPending} variant={isMember ? "secondary" : "primary"}>
              {isMember ? "Leave Company" : "Join Company"}
            </Button>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4">Members</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {group.members.map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <Avatar src={member.user.profileImage} name={getDisplayName(member.user)} size={32} />
              <div>
                <p className="text-sm font-medium">{getDisplayName(member.user)}</p>
                <p className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                  Joined {formatRelativeTime(member.joinedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post Creation (Members Only) */}
      {isMember && (
        <div className="card">
          <form onSubmit={handleCreatePost} className="space-y-3">
      {error && (
        <div className="form-error p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <Avatar src={currentUser.profileImage} name={getDisplayName(currentUser)} />
              <div className="flex-1 space-y-3">
                <MentionTextarea
                  placeholder="Share with the company..."
                  rows={3}
                  value={postContent}
                  mentions={mentions}
                  onChange={setPostContent}
                  onMentionsChange={setMentions}
                  disabled={isPending}
                />
                <PostImagePicker
                  files={postImages}
                  onChange={setPostImages}
                  disabled={isPending || isSubmittingPost}
                />
                <div className="flex justify-end">
                  <Button type="submit" loading={isPending || isSubmittingPost} disabled={!postContent.trim() || isSubmittingPost}>
                    Post to Company
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Group Feed */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Company Posts</h3>

        {group.posts.length === 0 ? (
          <div className="card">
            <p style={{ color: "var(--color-foreground-secondary)" }}>
              No posts yet. {isMember ? "Be the first to post!" : "Join the company to post."}
            </p>
          </div>
        ) : (
          group.posts.map((post) => (
            <div key={post.id} className="card">
              <div className="space-y-4">
                {/* Post Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar src={post.author.profileImage} name={getDisplayName(post.author)} />
                    <div>
                      <p className="font-medium">{getDisplayName(post.author)}</p>
                      <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                        {formatRelativeTime(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  {post.isPinned && <Badge variant="warning">Pinned</Badge>}
                </div>

                {/* Post Content */}
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {renderPostContentWithMentions(post.content, post.mentions || [])}
                </p>
                <PostImageGrid images={post.images} displaySize={post.imageDisplaySize} />

                {/* Post Actions */}
                <div className="flex flex-wrap items-center gap-4 pt-2 border-t" style={{ borderColor: "var(--color-card-border)" }}>
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className="text-sm"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-foreground-muted)",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {post._count.likes} likes
                  </button>
                  <span className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                    {post._count.comments} comments
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
