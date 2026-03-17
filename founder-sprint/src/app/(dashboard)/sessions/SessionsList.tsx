"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createSession, updateSession, deleteSession, saveSessionAsTemplate } from "@/actions/session";
import { formatDate, toValidDate } from "@/lib/utils";
import { TIMEZONE_OPTIONS } from "@/lib/timezone";
import { useToast } from "@/hooks/useToast";
import { BatchSelect, type BatchOption } from "@/components/ui/BatchSelect";

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
  batches?: { batch: { id: string; name: string } }[];
  targetGroup?: { id: string; name: string } | null;
}

interface SessionsListProps {
  sessions: Session[];
  isAdmin: boolean;
  batchOptions: BatchOption[];
  groupOptions: Array<{ id: string; name: string }>;
  templates: Array<{
    id: string;
    name: string;
    title: string;
    description: string | null;
    timezone: string;
    slidesUrl: string | null;
    recordingUrl: string | null;
    defaultStartTime: string | null;
    defaultEndTime: string | null;
  }>;
}

export function SessionsList({ sessions, isAdmin, batchOptions, groupOptions, templates }: SessionsListProps) {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editSession, setEditSession] = useState<Session | null>(null);
   const [isPending, startTransition] = useTransition();
   const [error, setError] = useState("");
   const [selectedTemplateId, setSelectedTemplateId] = useState("");
   const toast = useToast();

   const searchParams = useSearchParams();
   const prefillDate = searchParams.get("date");
   const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || null;

   const toDateInputValue = (value: Date | string | null | undefined) => {
     const parsed = toValidDate(value);
     return parsed ? parsed.toISOString().split("T")[0] : "";
   };

   const toTimeInputValue = (value: Date | string | null | undefined) => {
     const parsed = toValidDate(value);
     return parsed
       ? parsed.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
       : "";
   };

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
        if ('warning' in result && result.warning) {
          setError(result.warning);
        }
        setIsModalOpen(false);
        setSelectedTemplateId("");
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
        toast.error(result.error);
      }
    });
  };

  const handleSaveTemplate = (sessionId: string, title: string) => {
    startTransition(async () => {
      const result = await saveSessionAsTemplate(sessionId, title);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Session template saved.");
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
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Sessions</h1>
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
                    {session.batches && session.batches.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {session.batches.slice(0, 3).map((b) => (
                          <span
                            key={b.batch.id}
                            style={{
                              fontSize: 11,
                              backgroundColor: "#f0f0f0",
                              color: "#666666",
                              padding: "1px 6px",
                              borderRadius: 4,
                              fontFamily: '"BDO Grotesk", sans-serif',
                            }}
                          >
                            {b.batch.name}
                          </span>
                        ))}
                        {session.batches.length > 3 && (
                          <span style={{ fontSize: 11, color: "#999999", fontFamily: '"BDO Grotesk", sans-serif' }}>
                            +{session.batches.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    {session.targetGroup && (
                      <div className="mt-1">
                        <Badge variant="default">Group: {session.targetGroup.name}</Badge>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveTemplate(session.id, session.title)}
                        disabled={isPending}
                      >
                        Save as Template
                      </Button>
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
        <form key={selectedTemplateId || "new"} onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="form-error p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {templates.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Start from template (optional)</label>
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className="w-full px-3 py-2 rounded-md border text-sm"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              >
                <option value="">Blank session</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>
          )}

          <BatchSelect batches={batchOptions} />
          <Input
            name="title"
            label="Title"
            placeholder="Session 1: Introduction"
            defaultValue={selectedTemplate?.title || ""}
            required
          />

          <Textarea
            name="description"
            label="Description"
            placeholder="Brief overview of the session"
            defaultValue={selectedTemplate?.description || ""}
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
                defaultValue={selectedTemplate?.defaultStartTime || ""}
              />
              <Input
                name="endTime"
                label="End Time (optional)"
                type="time"
                placeholder="e.g. 16:00"
                defaultValue={selectedTemplate?.defaultEndTime || ""}
              />
           </div>

           <div className="space-y-1.5">
             <label className="text-sm font-medium">Timezone</label>
             <select
                name="timezone"
                defaultValue={selectedTemplate?.timezone || "Asia/Seoul"}
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
               defaultValue={selectedTemplate?.slidesUrl || ""}
             />

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Target Group (optional)</label>
              <select
                name="targetGroupId"
                defaultValue=""
                className="w-full px-3 py-2 rounded-md border text-sm"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              >
                <option value="">Entire selected batch</option>
                {groupOptions.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

           <Input
             name="recordingUrl"
             label="Recording URL"
             type="url"
             placeholder="https://www.youtube.com/watch?v=..."
             defaultValue={selectedTemplate?.recordingUrl || ""}
           />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setIsModalOpen(false); setSelectedTemplateId(""); }}
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

            <BatchSelect
              batches={batchOptions}
              selectedBatchIds={editSession.batches?.map(b => b.batch.id)}
            />
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
                defaultValue={toDateInputValue(editSession.sessionDate)}
               required
             />

             <div className="grid grid-cols-2 gap-3">
               <Input
                 name="startTime"
                 label="Start Time (optional)"
                 type="time"
                  defaultValue={toTimeInputValue(editSession.startTime)}
               />
               <Input
                 name="endTime"
                 label="End Time (optional)"
                 type="time"
                  defaultValue={toTimeInputValue(editSession.endTime)}
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

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Target Group (optional)</label>
                <select
                  name="targetGroupId"
                  defaultValue={editSession.targetGroup?.id || ""}
                  className="w-full px-3 py-2 rounded-md border text-sm"
                  style={{
                    backgroundColor: "var(--color-background)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-foreground)",
                  }}
                >
                  <option value="">Entire selected batch</option>
                  {groupOptions.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>

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
