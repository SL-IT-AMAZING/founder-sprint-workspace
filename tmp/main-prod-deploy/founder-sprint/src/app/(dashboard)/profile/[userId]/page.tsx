import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getEnhancedUserProfile } from "@/actions/profile";
import { checkIsFollowing, getUserFollowers, getUserFollowing } from "@/actions/follow";
import { getUserPosts } from "@/actions/feed";
import { ProfileClient } from "./ProfileClient";
import Link from "next/link";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { userId } = await params;

  const result = await getEnhancedUserProfile(userId);

  if (!result.success) {
    return (
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "40px 24px",
          textAlign: "center",
          backgroundColor: "#fefaf3",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
            padding: "40px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#2F2C26",
              margin: 0,
            }}
          >
            Profile not found
          </h2>
          <p
            style={{
              color: "#666666",
              marginTop: "12px",
              fontSize: "14px",
            }}
          >
            This user does not exist or is not in your batch.
          </p>
          <Link
            href="/feed"
            style={{
              color: "#1A1A1A",
              marginTop: "24px",
              display: "inline-block",
              fontSize: "14px",
              textDecoration: "underline",
            }}
          >
            ← Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = user.id === userId;
  const [isFollowing, userPosts, followersData, followingData] = await Promise.all([
    isOwnProfile ? Promise.resolve(false) : checkIsFollowing(userId),
    getUserPosts(userId),
    getUserFollowers(userId, 1, 50),
    getUserFollowing(userId, 1, 50),
  ]);

  return (
    <ProfileClient
      profile={result.data}
      isFollowing={isFollowing}
      isOwnProfile={isOwnProfile}
      currentUserId={user.id}
      userPosts={userPosts}
      followers={followersData.users}
      following={followingData.users}
    />
  );
}
