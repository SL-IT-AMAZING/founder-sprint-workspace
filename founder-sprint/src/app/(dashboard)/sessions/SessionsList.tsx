"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createSession, updateSession, deleteSession, saveSessionAsTemplate } from "@/actions/session";
import { getCompaniesForBatch } from "@/actions/company";
import { formatDate, toValidDate } from "@/lib/utils";
import { TIMEZONE_OPTIONS } from "@/lib/timezone";
import { useToast } from "@/hooks/useToast";
import { BatchSelect, type BatchOption } from "@/components/ui/BatchSelect";
import { CompanySelect, type CompanyOption } from "@/components/ui/CompanySelect";
import { PageCategoryLabel } from "@/components/layout/PageCategoryLabel";
import { addMinutesToTimeValue, getTimeRangeDurationMinutes } from "@/lib/schedule-form";

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
  targetCompanyIds: string[];
}

interface SessionsListProps {
  sessions: Session[];
  isAdmin: boolean;
  batchOptions: BatchOption[];
  companyOptions: CompanyOption[];
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
  userTimezone: string | null;
}

export function SessionsList({ sessions, isAdmin, batchOptions, companyOptions, templates, userTimezone }: SessionsListProps) {
   const searchParams = useSearchParams();
   const prefillDate = searchParams.get("date");
   const [isModalOpen, setIsModalOpen] = useState(Boolean(prefillDate && isAdmin));
   const [editSession, setEditSession] = useState<Session | null>(null);
   const [isPending, startTransition] = useTransition();
   const [error, setError] = useState("");
   const [selectedTemplateId, setSelectedTemplateId] = useState("");
   const toast = useToast();
   const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || null;
   const createStartTimeRef = useRef<HTMLInputElement>(null);
   const createEndTimeRef = useRef<HTMLInputElement>(null);
   const editStartTimeRef = useRef<HTMLInputElement>(null);
   const editEndTimeRef = useRef<HTMLInputElement>(null);
   const createDurationMinutesRef = useRef(60);
   const editDurationMinutesRef = useRef(60);
   const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
   const [availableCompanies, setAvailableCompanies] = useState<CompanyOption[]>(companyOptions);
   const [selectedEditBatchIds, setSelectedEditBatchIds] = useState<string[]>([]);
   const [editCompanies, setEditCompanies] = useState<CompanyOption[]>(companyOptions);

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

   useEffect(() => {
     createDurationMinutesRef.current = getTimeRangeDurationMinutes(
       selectedTemplate?.defaultStartTime || "",
       selectedTemplate?.defaultEndTime || ""
     ) ?? 60;
   }, [selectedTemplate?.defaultStartTime, selectedTemplate?.defaultEndTime, isModalOpen]);

   useEffect(() => {
     editDurationMinutesRef.current = editSession
        ? getTimeRangeDurationMinutes(
            toTimeInputValue(editSession.startTime),
            toTimeInputValue(editSession.endTime)
          ) ?? 60
        : 60;
    }, [editSession]);

   useEffect(() => {
     if (!editSession) return;
     const ids = editSession.batches?.map((b) => b.batch.id) || [];
     setSelectedEditBatchIds(ids);
     if (ids.length === 1) {
       void handleEditBatchSelection({ mode: "specific", batchIds: ids });
     } else {
       setEditCompanies([]);
     }
   }, [editSession]);

   useEffect(() => {
     if (batchOptions.length > 0 && selectedBatchIds.length === 0) {
       const initialBatchId = batchOptions[0].id;
       setSelectedBatchIds([initialBatchId]);
       void handleCreateBatchSelection({ mode: "specific", batchIds: [initialBatchId] });
     }
   }, [batchOptions, selectedBatchIds.length]);

   const createDefaultStartTime = selectedTemplate?.defaultStartTime || "";
   const createDefaultDurationMinutes = getTimeRangeDurationMinutes(
     selectedTemplate?.defaultStartTime || "",
     selectedTemplate?.defaultEndTime || ""
   ) ?? 60;
   const createDefaultEndTime = selectedTemplate?.defaultEndTime || (
     createDefaultStartTime ? addMinutesToTimeValue(createDefaultStartTime, createDefaultDurationMinutes) : ""
   );

   const handleCreateStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (!createEndTimeRef.current || !e.target.value) {
       return;
     }

     createEndTimeRef.current.value = addMinutesToTimeValue(
       e.target.value,
       createDurationMinutesRef.current
     );
   };

   const handleCreateEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (createStartTimeRef.current && e.target.value) {
       const nextDuration = getTimeRangeDurationMinutes(createStartTimeRef.current.value, e.target.value);
       if (nextDuration) {
         createDurationMinutesRef.current = nextDuration;
       }
     }
   };

   const handleEditStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (!editEndTimeRef.current || !e.target.value) {
       return;
     }

     editEndTimeRef.current.value = addMinutesToTimeValue(
       e.target.value,
       editDurationMinutesRef.current
     );
   };

   const handleEditEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (editStartTimeRef.current && e.target.value) {
       const nextDuration = getTimeRangeDurationMinutes(editStartTimeRef.current.value, e.target.value);
       if (nextDuration) {
         editDurationMinutesRef.current = nextDuration;
       }
     }
   };

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

   const handleCreateBatchSelection = async (selection: { mode: "all" | "specific"; batchIds: string[] }) => {
     if (selection.mode === "specific" && selection.batchIds.length === 1) {
       const companies = await getCompaniesForBatch(selection.batchIds[0]);
       setAvailableCompanies(companies.map((company) => ({ id: company.id, name: company.name, memberCount: company._count.members })));
     } else {
       setAvailableCompanies([]);
     }
     setSelectedBatchIds(selection.batchIds);
   };

   const handleEditBatchSelection = async (selection: { mode: "all" | "specific"; batchIds: string[] }) => {
     if (selection.mode === "specific" && selection.batchIds.length === 1) {
       const companies = await getCompaniesForBatch(selection.batchIds[0]);
       setEditCompanies(companies.map((company) => ({ id: company.id, name: company.name, memberCount: company._count.members })));
     } else {
       setEditCompanies([]);
     }
     setSelectedEditBatchIds(selection.batchIds);
   };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageCategoryLabel label="Batch" />
          <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Sessions</h1>
        </div>
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
                    {(session.targetCompanyIds?.length || 0) > 0 && (
                      <div className="mt-1">
                        <Badge variant="default">Companies: {session.targetCompanyIds.length}</Badge>
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

          <BatchSelect batches={batchOptions} onSelectionChange={handleCreateBatchSelection} />
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
                 ref={createStartTimeRef}
                 onChange={handleCreateStartTimeChange}
                 defaultValue={createDefaultStartTime}
               />
               <Input
                 name="endTime"
                 label="End Time (optional)"
                 type="time"
                 placeholder="e.g. 16:00"
                 ref={createEndTimeRef}
                 onChange={handleCreateEndTimeChange}
                 defaultValue={createDefaultEndTime}
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

             <CompanySelect
               companies={availableCompanies}
               totalBatchMembers={availableCompanies.reduce((sum, company) => sum + company.memberCount, 0)}
               label="Target Companies"
               inputName="companyIds"
               allowSpecific={selectedBatchIds.length === 1}
               disabledMessage="Specific companies are available only when exactly one batch is selected."
             />

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
                onClick={() => { setIsModalOpen(false); setSelectedTemplateId(""); createDurationMinutesRef.current = 60; }}
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
          editDurationMinutesRef.current = 60;
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
                  ref={editStartTimeRef}
                  onChange={handleEditStartTimeChange}
                  defaultValue={toTimeInputValue(editSession.startTime)}
               />
               <Input
                 name="endTime"
                 label="End Time (optional)"
                 type="time"
                   ref={editEndTimeRef}
                   onChange={handleEditEndTimeChange}
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

               <CompanySelect
                 companies={editCompanies}
                 totalBatchMembers={editCompanies.reduce((sum, company) => sum + company.memberCount, 0)}
                 label="Target Companies"
                 inputName="companyIds"
                 allowSpecific={selectedEditBatchIds.length === 1}
                 disabledMessage="Specific companies are available only when exactly one batch is selected."
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
                  editDurationMinutesRef.current = 60;
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
