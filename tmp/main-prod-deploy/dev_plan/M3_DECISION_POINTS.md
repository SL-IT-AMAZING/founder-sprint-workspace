# M3 Messaging System - Decision Points

Before implementation begins, please clarify these 5 key decisions:

---

## 1. Company Messaging Behavior

**Context**: When a user clicks "Message" on a company profile page, who should receive the message?

**Options**:
- **Option A (Recommended)**: DM the primary founder
  - Finds first company member with `role = "founder"`
  - Falls back to first company member if no founder
  - Simple, predictable behavior
  - Matches LinkedIn/Twitter DM patterns
  
- **Option B**: Create a group chat with ALL company members
  - Broadcasts to entire team
  - Could be overwhelming for larger companies
  - May not match user expectations

**Your Decision**: [ ]

---

## 2. Realtime Disconnection Handling

**Context**: If Supabase Realtime WebSocket disconnects (rare but possible), how should we handle it?

**Options**:
- **Option A (Recommended for MVP)**: Show "Disconnected" state in UI
  - Connection badge appears in conversation header
  - User can refresh page to reconnect
  - Simple, no additional infrastructure
  - Matches existing Supabase recommendations
  
- **Option B**: Implement polling fallback
  - Automatically polls for new messages every 5 seconds when disconnected
  - More resilient but adds complexity
  - Could increase server load
  - Not needed for MVP (can add later)

**Your Decision**: [ ]

---

## 3. Group Conversation Size Limit

**Context**: Should we limit the maximum number of participants in a group conversation?

**Options**:
- **Enforce a limit** (e.g., 20 participants max)
  - Prevents performance issues with large groups
  - Matches most messaging platforms (Slack: 15-20, WhatsApp: 256)
  - Recommended: **20 participants** (including creator)
  
- **No limit** (current schema allows up to 30 per batch)
  - More flexible
  - Could lead to UX issues (too many avatars to display)
  - Batch already limits to max 30 founders

**Your Decision**: [ ]

**If limiting, what should the max be?**: [ ] participants

---

## 4. Message Content Length

**Context**: How long should a single message be allowed to be?

**Current Plan**: 10,000 characters (roughly 1,500 words)

**Considerations**:
- YC Bookface screenshots show short messages (typical chat behavior)
- 10,000 chars allows for longer explanations if needed
- Too long could break UI layout
- Slack: 4,000 chars
- Discord: 2,000 chars
- WhatsApp: ~65,000 chars

**Your Decision**: [ ] characters (or keep 10,000)

---

## 5. Message History / Pagination

**Context**: How many historical messages should we load per conversation?

**Current Plan**: Load 500 most recent messages on page load

**Options**:
- **500 messages, no pagination UI** (recommended for MVP)
  - Simple implementation
  - Covers 99% of use cases (most conversations won't reach 500)
  - Can add "Load More" button later if needed
  
- **Implement pagination now**
  - "Load More" button at top of thread
  - Loads in batches of 50-100
  - More complex, longer implementation
  - Needed for very active groups

**Your Decision**: [ ]

**If implementing pagination, what batch size?**: [ ] messages per load

---

## Summary of Recommendations

Based on industry standards and YC Bookface screenshot analysis:

| Decision | Recommended Choice | Rationale |
|----------|-------------------|-----------|
| Company Messaging | **Option A: DM the founder** | Matches user expectations, simpler UX |
| Realtime Fallback | **Option A: Show disconnected state** | Simple MVP, can enhance later |
| Group Size Limit | **20 participants** | Prevents UX/performance issues |
| Message Length | **10,000 characters** | Flexible but not excessive |
| Message History | **500 messages, no pagination** | Sufficient for MVP |

---

## Next Steps

Once you've made these decisions:

1. I'll update the implementation plan with your choices
2. We'll proceed with Phase 1: Database Schema
3. Estimated timeline: **3-4 working days with 2-3 developers**

**Please indicate your decisions above and let me know when you're ready to proceed!**
