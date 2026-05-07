"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createAssignment, saveAssignmentAsTemplate, deleteAssignmentTemplate } from "@/actions/assignment";
import { getCompaniesForBatch } from "@/actions/company";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { CompanySelect, type CompanyOption } from "@/components/ui/CompanySelect";
import { PageCategoryLabel } from "@/components/layout/PageCategoryLabel";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  templateUrl: string | null;
  dueDate: Date;
  targetCompanyIds?: string[];
  batch?: { id: string; name: string } | null;
  _count?: { submissions: number };
}

interface BatchOption {
  id: string;
  name: string;
}

interface AssignmentTemplateOption {
  id: string;
  name: string;
  title: string;
  description: string;
  templateUrl: string | null;
  reviewCriteria: string[];
}

interface AssignmentsListProps {
  assignments: AssignmentItem[];
  canCreate: boolean;
  isAdmin: boolean;
  batches: BatchOption[];
  currentBatchId: string;
  availableCompanies: CompanyOption[];
  templates: AssignmentTemplateOption[];
}

export function AssignmentsList({
  assignments,
  canCreate,
  isAdmin,
  batches,
  currentBatchId,
  availableCompanies,
  templates,
}: AssignmentsListProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedBatchId, setSelectedBatchId] = useState(currentBatchId);
  const [availableCompaniesState, setAvailableCompaniesState] = useState<CompanyOption[]>(availableCompanies);
  const [showThisWeekOnly, setShowThisWeekOnly] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [localTemplates, setLocalTemplates] = useState(templates);
  const toast = useToast();

  const weekStart = new Date();
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const visibleAssignments = assignments.filter((assignment) => {
    if (!showThisWeekOnly) return true;
    const dueAt = new Date(assignment.dueDate);
    return dueAt >= weekStart && dueAt < weekEnd;
  });

  const selectedTemplate = useMemo(
    () => localTemplates.find((template) => template.id === selectedTemplateId) || null,
    [localTemplates, selectedTemplateId]
  );

  const handleDeleteTemplate = (templateId: string) => {
    startTransition(async () => {
      const result = await deleteAssignmentTemplate(templateId);
      if (result.success) {
        setLocalTemplates((prev) => prev.filter((t) => t.id !== templateId));
        if (selectedTemplateId === templateId) setSelectedTemplateId("");
        toast.success("Template deleted.");
      } else {
        toast.error(result.error);
      }
    });
  };

  useEffect(() => {
    setSelectedBatchId(currentBatchId);
    setAvailableCompaniesState(availableCompanies);
  }, [currentBatchId, availableCompanies]);

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await createAssignment(formData);
      if (result.success) {
        setCreateOpen(false);
        setSelectedTemplateId("");
        form.reset();
      } else {
        setError(result.error);
      }
    });
  };

  const handleBatchChange = async (batchId: string) => {
    setSelectedBatchId(batchId);
    const companies = await getCompaniesForBatch(batchId);
    setAvailableCompaniesState(companies.map((company) => ({ id: company.id, name: company.name, memberCount: company._count.members })));
  };

  const handleSaveTemplate = (assignmentId: string, title: string) => {
    startTransition(async () => {
      const result = await saveAssignmentAsTemplate(assignmentId, title);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Assignment template saved.");
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <PageCategoryLabel label="Batch" />
          <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>
            Assignments
          </h1>
        </div>
        {canCreate && <Button onClick={() => setCreateOpen(true)}>Create Assignment</Button>}
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Assignments will appear here once they are published."
          action={canCreate ? <Button onClick={() => setCreateOpen(true)}>Create Assignment</Button> : undefined}
        />
      ) : (
        <div className="space-y-4">
          <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
            <input
              type="checkbox"
              checked={showThisWeekOnly}
              onChange={(event) => setShowThisWeekOnly(event.target.checked)}
            />
            This week only
          </label>

          {visibleAssignments.length === 0 && (
            <div className="card">
              <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                No assignments due this week.
              </p>
            </div>
          )}

          {visibleAssignments.map((assignment) => (
            <div key={assignment.id} className="card">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium">{assignment.title}</h3>
                    <p className="text-sm" style={{ color: "var(--color-foreground-secondary)", whiteSpace: "pre-wrap" }}>
                      {assignment.description}
                    </p>
                  </div>
                  <Badge variant="warning">Due {formatDate(assignment.dueDate)}</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {assignment.batch && <Badge variant="default">{assignment.batch.name}</Badge>}
                  {(assignment.targetCompanyIds?.length || 0) > 0 && (
                    <Badge variant="success">Companies: {assignment.targetCompanyIds?.length}</Badge>
                  )}
                  {assignment.templateUrl && (
                    <a href={assignment.templateUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                      Template →
                    </a>
                  )}
                  <span style={{ color: "var(--color-foreground-muted)" }}>
                    {(assignment._count?.submissions || 0)} submission(s)
                  </span>
                </div>

                <div>
                  <Link href={`/assignments/${assignment.id}`} style={{ color: "var(--color-primary)", fontSize: 14 }}>
                    View assignment →
                  </Link>
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => handleSaveTemplate(assignment.id, assignment.title)}
                      style={{ color: "var(--color-primary)", fontSize: 14, marginLeft: 12, background: "none", border: "none", cursor: "pointer" }}
                    >
                      Save as template
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setError(null); }} title="Create Assignment">
        <form key={selectedTemplateId || "new"} onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start from template (optional)</label>
            <p className="text-xs" style={{ color: "var(--color-foreground-muted)", marginTop: -2 }}>
              Choose a template to automatically fill in the title, description, template link, and review criteria.
            </p>

            {localTemplates.length > 0 ? (
              <div className="flex gap-2">
                <select
                  value={selectedTemplateId}
                  onChange={(event) => setSelectedTemplateId(event.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border"
                  disabled={isPending}
                >
                  <option value="">Blank assignment</option>
                  {localTemplates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
                {selectedTemplateId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      if (confirm("Delete this template? This removes only the saved template. Existing assignments will not be deleted.")) {
                        handleDeleteTemplate(selectedTemplateId);
                      }
                    }}
                    style={{ color: "var(--color-error)" }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--color-foreground-muted)", fontStyle: "italic" }}>
                No saved templates yet. Create an assignment first, then use &quot;Save as template&quot; to reuse it later.
              </p>
            )}

            {selectedTemplate && (
              <div
                className="space-y-2"
                style={{
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--color-card-border)",
                  backgroundColor: "var(--color-background-secondary)",
                }}
              >
                <p className="text-xs font-medium" style={{ color: "var(--color-foreground-secondary)" }}>
                  Template preview
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{selectedTemplate.title}</p>
                  {selectedTemplate.description && (
                    <p className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                      {selectedTemplate.description.length > 120
                        ? `${selectedTemplate.description.slice(0, 120)}...`
                        : selectedTemplate.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {selectedTemplate.templateUrl && (
                    <span className="text-xs" style={{ color: "var(--color-primary)" }}>📎 Template link included</span>
                  )}
                  {selectedTemplate.reviewCriteria.length > 0 && (
                    <span className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                      {selectedTemplate.reviewCriteria.length} review {selectedTemplate.reviewCriteria.length === 1 ? "criterion" : "criteria"}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <Input name="title" label="Title" required disabled={isPending} defaultValue={selectedTemplate?.title || ""} />
          <Textarea name="description" label="Description" required rows={5} disabled={isPending} defaultValue={selectedTemplate?.description || ""} />
          <Input name="templateUrl" label="Template URL" type="url" disabled={isPending} defaultValue={selectedTemplate?.templateUrl || ""} />
          <Input name="dueDate" label="Due Date" type="date" required disabled={isPending} />
          {selectedTemplate && selectedTemplate.reviewCriteria.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Review Criteria</label>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.reviewCriteria.map((criterion) => (
                  <Badge key={criterion} variant="default">{criterion}</Badge>
                ))}
              </div>
            </div>
          )}

          {isAdmin && batches.length > 0 && (
            <div className="space-y-1">
                <label className="text-sm font-medium">Batch</label>
                <select name="batchId" value={selectedBatchId} onChange={(event) => void handleBatchChange(event.target.value)} className="w-full px-3 py-2 rounded-lg border" disabled={isPending}>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>{batch.name}</option>
                  ))}
                </select>
              </div>
            )}

            <CompanySelect
              companies={availableCompaniesState}
              totalBatchMembers={availableCompaniesState.reduce((sum, company) => sum + company.memberCount, 0)}
              label="Target Companies"
              inputName="companyIds"
            />

          {error && <div className="form-error p-3 rounded-lg text-sm">{error}</div>}

          <div className="flex justify-end gap-3">
             <Button type="button" variant="ghost" onClick={() => { setCreateOpen(false); setError(null); setSelectedTemplateId(""); }} disabled={isPending}>Cancel</Button>
             <Button type="submit" loading={isPending}>Create Assignment</Button>
           </div>
         </form>
      </Modal>
    </div>
  );
}
