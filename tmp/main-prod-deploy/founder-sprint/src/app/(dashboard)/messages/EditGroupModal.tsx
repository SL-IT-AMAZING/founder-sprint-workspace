"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { updateGroupConversation } from "@/actions/messaging";
import type { ConversationDetail } from "@/actions/messaging";
import { GroupAvatar } from "@/components/ui/GroupAvatar";
import { ImageCropModal } from "@/components/ui/ImageCropModal";

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupUpdated: () => void;
  conversation: ConversationDetail;
  allUsers: { id: string; name: string | null; profileImage: string | null }[];
  currentUserId: string;
}

export default function EditGroupModal({
  isOpen,
  onClose,
  onGroupUpdated,
  conversation,
  allUsers,
  currentUserId,
}: EditGroupModalProps) {
  const [groupName, setGroupName] = useState(conversation.groupName || "");
  const [groupEmoji, setGroupEmoji] = useState(conversation.groupEmoji || "");
  const [groupImageUrl, setGroupImageUrl] = useState<string | null>(conversation.groupImage || null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>(
    conversation.participants.map((p) => p.id)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialParticipantIds = useMemo(
    () => new Set(conversation.participants.map((p) => p.id)),
    [conversation.participants]
  );

  const availableUsers = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const filtered = allUsers.filter((u) => u.id !== currentUserId);
    if (!normalizedSearch) return filtered;
    return filtered.filter((u) => (u.name || "").toLowerCase().includes(normalizedSearch));
  }, [searchQuery, allUsers, currentUserId]);

  const handleToggleUser = (userId: string) => {
    setParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploadingImage(true);
    setError(null);
    setCropSrc(null);

    try {
      const formData = new FormData();
      formData.append("file", croppedBlob, "group-image.jpg");
      formData.append("bucket", "group-images");

      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await response.json();

      if (result.success && result.url) {
        setGroupImageUrl(result.url);
      } else {
        setError(result.error || "Failed to upload image");
      }
    } catch {
      setError("Failed to upload image");
    }

    setUploadingImage(false);
  };

  const handleRemoveImage = () => {
    setGroupImageUrl(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!groupName.trim()) return;

    setSubmitting(true);
    setError(null);

    const addParticipantIds = participantIds.filter((id) => !initialParticipantIds.has(id));
    const removeParticipantIds = Array.from(initialParticipantIds).filter(
      (id) => id !== currentUserId && !participantIds.includes(id)
    );

    const result = await updateGroupConversation(conversation.id, {
      name: groupName.trim(),
      emoji: groupEmoji.trim() || null,
      image: groupImageUrl,
      addParticipantIds: addParticipantIds.length > 0 ? addParticipantIds : undefined,
      removeParticipantIds: removeParticipantIds.length > 0 ? removeParticipantIds : undefined,
    });

    if (result.success) {
      onGroupUpdated();
      onClose();
    } else {
      setError(result.error || "Failed to update group");
    }

    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
        onClick={onClose}
      >
        <div
          style={{
            width: "480px",
            maxHeight: "600px",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2 style={{ margin: 0, color: "#2F2C26", fontSize: "20px", fontWeight: 700 }}>Edit Group</h2>
            <button
              onClick={onClose}
              style={{
                border: "none",
                backgroundColor: "transparent",
                color: "#666666",
                fontSize: "20px",
                cursor: "pointer",
                lineHeight: 1,
              }}
              aria-label="Close edit group modal"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "16px", overflowY: "auto" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#2F2C26", fontWeight: 600 }}>
              Group Image
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div
                style={{ cursor: "pointer", position: "relative" }}
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
              >
                {groupImageUrl ? (
                  <GroupAvatar name={groupName || "G"} image={groupImageUrl} size={48} />
                ) : (
                  <GroupAvatar name={groupName || "G"} emoji={groupEmoji || undefined} size={48} />
                )}
                {uploadingImage && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "10px",
                      backgroundColor: "rgba(255,255,255,0.7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      color: "#666666",
                    }}
                  >
                    ...
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  style={{
                    border: "none",
                    backgroundColor: "transparent",
                    color: "#1A1A1A",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                    textAlign: "left",
                  }}
                >
                  {groupImageUrl ? "Change image" : "Upload image"}
                </button>
                {groupImageUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      border: "none",
                      backgroundColor: "transparent",
                      color: "#999999",
                      fontSize: "12px",
                      cursor: "pointer",
                      padding: 0,
                      textAlign: "left",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </div>

            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#2F2C26", fontWeight: 600 }}>
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              required
              maxLength={200}
              style={{
                width: "100%",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#2F2C26",
                fontSize: "14px",
                marginBottom: "12px",
                outline: "none",
              }}
            />

            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#2F2C26", fontWeight: 600 }}>
              Custom Icon{" "}
              <span style={{ fontWeight: 400, color: "#999999" }}>(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 🚀"
              value={groupEmoji}
              onChange={(event) => setGroupEmoji(event.target.value)}
              maxLength={10}
              style={{
                width: "60px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "8px",
                textAlign: "center",
                color: "#2F2C26",
                fontSize: "16px",
                marginBottom: "12px",
                outline: "none",
              }}
            />

            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#2F2C26", fontWeight: 600 }}>
              Members
            </label>

            {participantIds.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                {participantIds
                  .filter((id) => id !== currentUserId)
                  .map((id) => {
                    const u = allUsers.find((user) => user.id === id);
                    return (
                      <button
                        key={`member-${id}`}
                        type="button"
                        onClick={() => handleToggleUser(id)}
                        style={{
                          border: "1px solid #e0e0e0",
                          backgroundColor: "#fefaf3",
                          color: "#2F2C26",
                          borderRadius: "999px",
                          padding: "4px 10px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        {(u?.name || "Unknown") + " ×"}
                      </button>
                    );
                  })}
              </div>
            )}

            <input
              type="text"
              placeholder="Search people to add..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              style={{
                width: "100%",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#2F2C26",
                fontSize: "14px",
                marginBottom: "8px",
                outline: "none",
              }}
            />

            <div
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                maxHeight: "180px",
                overflowY: "auto",
                marginBottom: "12px",
              }}
            >
              {availableUsers.length === 0 ? (
                <div style={{ padding: "12px", color: "#999999", fontSize: "13px", textAlign: "center" }}>
                  No users found.
                </div>
              ) : (
                availableUsers.map((user) => {
                  const isSelected = participantIds.includes(user.id);

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleToggleUser(user.id)}
                      style={{
                        width: "100%",
                        border: "none",
                        borderBottom: "1px solid #f1eadd",
                        backgroundColor: isSelected ? "#fefaf3" : "#FFFFFF",
                        padding: "8px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: "#2F2C26",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: "#f1eadd",
                            backgroundImage: user.profileImage ? `url(${user.profileImage})` : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: "13px" }}>{user.name || "Unknown"}</span>
                      </span>
                      <span style={{ color: isSelected ? "#2E7D32" : "#999999", fontSize: "12px", fontWeight: 600 }}>
                        {isSelected ? "Member" : "Add"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {error && <div style={{ color: "#C62828", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}

            <button
              type="submit"
              disabled={submitting || !groupName.trim()}
              style={{
                width: "100%",
                backgroundColor: "#1A1A1A",
                color: "#FFFFFF",
                borderRadius: "9px",
                padding: "10px",
                fontSize: "14px",
                fontWeight: 600,
                border: "none",
                cursor: submitting || !groupName.trim() ? "not-allowed" : "pointer",
                opacity: submitting || !groupName.trim() ? 0.6 : 1,
              }}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          isOpen={true}
          onClose={() => setCropSrc(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
