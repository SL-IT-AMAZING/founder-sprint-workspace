import { getCurrentUser } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getUserConversations, getAllUsersForMessaging } from "@/actions/messaging";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  
  const [result, usersResult] = await Promise.all([
    getUserConversations(),
    getAllUsersForMessaging(),
  ]);
  const conversations = result.success ? result.data : [];
  const allUsers = usersResult.success ? usersResult.data : [];
  
  return (
    <MessagesClient
      conversations={conversations}
      currentUserId={user.id}
      currentUserName={user.name}
      currentUserImage={user.profileImage}
      allUsers={allUsers}
    />
  );
}
