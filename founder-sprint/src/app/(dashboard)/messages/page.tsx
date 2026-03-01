import { getCurrentUser } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getUserConversations } from "@/actions/messaging";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  
  const result = await getUserConversations();
  const conversations = result.success ? result.data : [];
  
  return (
    <MessagesClient
      conversations={conversations}
      currentUserId={user.id}
      currentUserName={user.name}
      currentUserImage={user.profileImage}
    />
  );
}
