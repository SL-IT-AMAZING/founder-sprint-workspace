# Draft: Missing CRUD Operations Implementation

## Requirements (confirmed)
- 8 CRUD operations need to be implemented following existing patterns
- All operations need server actions + UI components

## Technical Decisions
- **Pattern**: Follow existing server action pattern (zod validation, getCurrentUser, requireRole, prisma, revalidatePath)
- **UI**: Use Modal component for edit forms, confirm() or Modal for delete confirmations
- **State**: useTransition for pending states, useState for modals/errors

## Research Findings

### Server Action Patterns (from existing code)
1. All actions use `"use server"` directive
2. Authentication: `getCurrentUser()` returns null if not authenticated
3. Authorization: `requireRole(user.role, ["super_admin", "admin"])` for admin actions
4. Validation: Zod schemas for form data
5. Response: `ActionResult<T>` type with success/error
6. Revalidation: `revalidatePath()` after mutations

### UI Patterns (from existing code)
1. Modal component: `<Modal open={boolean} onClose={fn} title={string}>`
2. Forms inside Modal with error display
3. `useTransition()` for loading states
4. `confirm()` for simple destructive actions
5. Custom confirmation Modal for more complex confirmations (see UserManagement.tsx)

### Prisma Schema Fields
- **Batch**: id, name, description, startDate, endDate, status
- **Assignment**: id, batchId, title, description, templateUrl, dueDate
- **Submission**: assignmentId_authorId unique constraint
- **Summary**: id, questionId (unique), authorId, content
- **Comment**: id, postId, parentId, authorId, content, createdAt, updatedAt
- **Post**: id, batchId, authorId, groupId, content, isPinned, isHidden
- **UserBatch**: userId_batchId unique, status ('invited'|'active')

## 8 Features to Implement

### 1. updateBatch (batch.ts)
- **Action**: Update batch name, description, startDate, endDate
- **Permission**: super_admin, admin
- **Schema**: Same as CreateBatchSchema + id
- **Revalidate**: /admin/batches
- **UI Location**: BatchList.tsx - add Edit button + EditBatchModal

### 2. updateAssignment (assignment.ts)
- **Action**: Update title, description, templateUrl, dueDate
- **Permission**: super_admin, admin (via canCreateAssignment)
- **Constraint**: Only if no submissions exist (count check)
- **Revalidate**: /assignments, /assignments/{id}
- **UI Location**: AssignmentsList.tsx or assignment detail page

### 3. deleteAssignment (assignment.ts)
- **Action**: Delete assignment
- **Permission**: super_admin, admin
- **Constraint**: Only if no submissions exist
- **Revalidate**: /assignments
- **UI Location**: AssignmentsList.tsx - add Delete button

### 4. updateSummary (question.ts)
- **Action**: Update summary content
- **Permission**: super_admin, admin
- **Revalidate**: /questions/{questionId}, /questions
- **UI Location**: question detail page - add edit button on summary display

### 5. updateComment (feed.ts)
- **Action**: Update comment content, track edit time
- **Permission**: Comment author only
- **Requirement**: Show "Edited" indicator (compare createdAt vs updatedAt)
- **Revalidate**: /feed, /feed/{postId}
- **UI Location**: PostDetail.tsx - add edit button on own comments

### 6. deleteComment (feed.ts)
- **Action**: Delete comment
- **Permission**: Comment author only
- **Revalidate**: /feed, /feed/{postId}
- **UI Location**: PostDetail.tsx - add delete button on own comments

### 7. restorePost (feed.ts)
- **Action**: Set isHidden=false (reverse of archivePost)
- **Permission**: super_admin, admin
- **Revalidate**: /feed, admin posts view
- **UI Location**: Need admin view for archived posts (or toggle in existing admin view)

### 8. cancelInvite (user-management.ts)
- **Action**: Delete userBatch where status='invited'
- **Permission**: super_admin, admin
- **Constraint**: Only for invited (not active) users
- **Revalidate**: /admin/users, /admin/batches
- **UI Location**: UserManagement.tsx - add Cancel button for invited users

## Scope Boundaries
- INCLUDE: Server actions + basic UI for all 8 features
- INCLUDE: Follow existing patterns exactly
- EXCLUDE: New admin pages for archived posts (restorePost will work via existing hidePost toggle)
- EXCLUDE: Advanced UI features not in requirements

## Open Questions
1. For restorePost - should we create a separate admin view for hidden posts, or use existing hidePost toggle behavior? (Existing hidePost already toggles, so restorePost may just be the explicit unhide action)
2. For updateComment - should we add an "isEdited" field to schema or just compare timestamps?

## Dependencies Between Tasks
- Server actions can be implemented in parallel (no interdependencies)
- UI changes depend on corresponding server actions
- Comment edit/delete can share UI patterns
