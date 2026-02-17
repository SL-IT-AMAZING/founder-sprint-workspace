"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createSession, updateSession, deleteSession } from "@/actions/session";
import { formatDate } from "@/lib/utils";
import { TIMEZONE_OPTIONS } from "@/lib/timezone";

interface Session {
  id: string;
  title: string;
  description: string | null;
  sessionDate: Date;
  startTime: Date | null;
  endTime: Date | null;
  timezone: string;
  slidesUrl: string | null;
  recordingUrl: string | null;
  createdAt: Date;
}

interface SessionsListProps {
  sessions: Session[];
  isAdmin: boolean;
}

export function SessionsList({ sessions, isAdmin }: SessionsListProps) {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editSession, setEditSession] = useState<Session | null>(null);
   const [isPending, startTransition] = useTransition();
   const [error, setError] = useState("");

   const searchParams = useSearchParams();
   const prefillDate = searchParams.get("date");

   // Auto-open create modal if date is pre-filled
   useEffect(() => {
     if (prefillDate && isAdmin) {
       setIsModalOpen(true);
     }
   }, [prefillDate, isAdmin]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createSession(formData);
      if (result.success) {
        setIsModalOpen(false);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error);
      }
    });
  };

  const handleDelete = (sessionId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    startTransition(async () => {
      const result = await deleteSession(sessionId);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editSession) return;
    setError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateSession(editSession.id, formData);
      if (result.success) {
        setEditSession(null);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Sessions</h1>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)}>Create Session</Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          description="Sessions will appear here once created"
          action={
            isAdmin ? (
              <Button onClick={() => setIsModalOpen(true)}>Create First Session</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="card">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{session.title}</h3>
                    <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                      {formatDate(session.sessionDate)}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditSession(session)}
                        disabled={isPending}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(session.id, session.title)}
                        disabled={isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>

                {session.description && (
                  <p style={{ color: "var(--color-foreground-secondary)" }}>
                    {session.description}
                  </p>
                )}

                <div className="flex gap-3">
                  {session.slidesUrl && (
                    <a
                      href={session.slidesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm"
                      style={{ color: "var(--color-primary)" }}
                    >
                      View Slides
                    </a>
                  )}
                  {session.recordingUrl && (
                    <a
                      href={session.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Watch Recording
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Session">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="form-error p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            name="title"
            label="Title"
            placeholder="Session 1: Introduction"
            required
          />

          <Textarea
            name="description"
            label="Description"
            placeholder="Brief overview of the session"
            rows={3}
          />

           <Input
             name="sessionDate"
             label="Session Date"
             type="date"
             required
             defaultValue={prefillDate || undefined}
           />

           <div className="grid grid-cols-2 gap-3">
             <Input
               name="startTime"
               label="Start Time (optional)"
               type="time"
               placeholder="e.g. 14:00"
             />
             <Input
               name="endTime"
               label="End Time (optional)"
               type="time"
               placeholder="e.g. 16:00"
             />
           </div>

           <div className="space-y-1.5">
             <label className="text-sm font-medium">Timezone</label>
             <select
               name="timezone"
               defaultValue="Asia/Seoul"
               className="w-full px-3 py-2 rounded-md border text-sm"
               style={{
                 backgroundColor: "var(--color-background)",
                 borderColor: "var(--color-border)",
                 color: "var(--color-foreground)",
               }}
             >
               {TIMEZONE_OPTIONS.map((tz) => (
                 <option key={tz.value} value={tz.value}>{tz.label}</option>
               ))}
             </select>
           </div>

           <Input
             name="slidesUrl"
             label="Slides URL"
             type="url"
             placeholder="https://docs.google.com/presentation/..."
           />

          <Input
            name="recordingUrl"
            label="Recording URL"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Create Session
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editSession}
        onClose={() => {
          setEditSession(null);
          setError("");
        }}
        title="Edit Session"
      >
        {editSession && (
          <form onSubmit={handleEdit} className="space-y-4">
            {error && (
              <div className="form-error p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              name="title"
              label="Title"
              placeholder="Session 1: Introduction"
              defaultValue={editSession.title}
              required
            />

            <Textarea
              name="description"
              label="Description"
              placeholder="Brief overview of the session"
              defaultValue={editSession.description || ""}
              rows={3}
            />

             <Input
               name="sessionDate"
               label="Session Date"
               type="date"
               defaultValue={new Date(editSession.sessionDate).toISOString().split("T")[0]}
               required
             />

             <div className="grid grid-cols-2 gap-3">
               <Input
                 name="startTime"
                 label="Start Time (optional)"
                 type="time"
                 defaultValue={editSession.startTime ? new Date(editSession.startTime).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }) : ""}
               />
               <Input
                 name="endTime"
                 label="End Time (optional)"
                 type="time"
                 defaultValue={editSession.endTime ? new Date(editSession.endTime).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }) : ""}
               />
             </div>

             <div className="space-y-1.5">
               <label className="text-sm font-medium">Timezone</label>
               <select
                 name="timezone"
                 defaultValue={editSession.timezone || "Asia/Seoul"}
                 className="w-full px-3 py-2 rounded-md border text-sm"
                 style={{
                   backgroundColor: "var(--color-background)",
                   borderColor: "var(--color-border)",
                   color: "var(--color-foreground)",
                 }}
               >
                 {TIMEZONE_OPTIONS.map((tz) => (
                   <option key={tz.value} value={tz.value}>{tz.label}</option>
                 ))}
               </select>
             </div>

             <Input
               name="slidesUrl"
               label="Slides URL"
               type="url"
               placeholder="https://docs.google.com/presentation/..."
               defaultValue={editSession.slidesUrl || ""}
             />

            <Input
              name="recordingUrl"
              label="Recording URL"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              defaultValue={editSession.recordingUrl || ""}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditSession(null);
                  setError("");
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
