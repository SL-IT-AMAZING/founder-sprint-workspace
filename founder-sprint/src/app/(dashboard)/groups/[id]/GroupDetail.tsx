"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { joinGroup, leaveGroup } from "@/actions/group";
import { createPost, toggleLike } from "@/actions/feed";
import { formatRelativeTime, getDisplayName } from "@/lib/utils";

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
  isPinned: boolean;
  createdAt: Date;
  author: User;
  images: PostImage[];
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
}

export function GroupDetail({ group, currentUserId, currentUser }: GroupDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [postContent, setPostContent] = useState("");
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

    const formData = new FormData();
    formData.append("content", postContent);
    formData.append("groupId", group.id);

    startTransition(async () => {
      const result = await createPost(formData);
      if (result.success) {
        setPostContent("");
      } else {
        setError(result.error);
      }
    });
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
        <div className="flex items-start justify-between gap-4">
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
          <Button onClick={handleJoinLeave} loading={isPending} variant={isMember ? "secondary" : "primary"}>
            {isMember ? "Leave Group" : "Join Group"}
          </Button>
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

            <div className="flex items-start gap-3">
              <Avatar src={currentUser.profileImage} name={getDisplayName(currentUser)} />
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Share with the group..."
                  rows={3}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button type="submit" loading={isPending} disabled={!postContent.trim()}>
                    Post to Group
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Group Feed */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Group Posts</h3>

        {group.posts.length === 0 ? (
          <div className="card">
            <p style={{ color: "var(--color-foreground-secondary)" }}>
              No posts yet. {isMember ? "Be the first to post!" : "Join the group to post."}
            </p>
          </div>
        ) : (
          group.posts.map((post) => (
            <div key={post.id} className="card">
              <div className="space-y-4">
                {/* Post Header */}
                <div className="flex items-start justify-between gap-4">
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
                <p style={{ whiteSpace: "pre-wrap" }}>{post.content}</p>

                {/* Post Actions */}
                <div className="flex items-center gap-4 pt-2 border-t" style={{ borderColor: "var(--color-card-border)" }}>
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
