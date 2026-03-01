# Bookface UI/UX Patterns: Quick Reference Guide

## 🎯 Core Identity
- **What it is:** Private, trust-based founder community (not generic social media)
- **Who uses it:** YC alumni + portfolio companies (members-only)
- **Core problem it solves:** "Knowing who is in the community and who you can trust to ask for help"
- **Founding principle:** Brand moderation + high context + shared founder identity

---

## 🏗️ Information Architecture

```
LEFT SIDEBAR (Primary Nav)          TOP BAR (Secondary Nav)
├─ Feed                              ├─ Global Search
├─ Directory                         ├─ Logo/Brand  
├─ Knowledge Base                    └─ Account Menu
├─ Deals                                ├─ Profile Switcher
├─ Jobs                                 ├─ Notifications
├─ Batches                              └─ Settings
└─ Messages (Inbox)

MAIN CONTENT                         RIGHT SIDEBAR (Contextual)
├─ Posts/Discussions                  ├─ Member Suggestions
├─ Mixed content types                ├─ Trending Topics
└─ CTAs (Ask Q, Create Post)          └─ Events
```

---

## 🔑 Critical Design Patterns

### 1. DIRECTORY AS CENTERPIECE
**Problem:** In large communities, hard to find relevant people
**Bookface solution:** 
- Dedicated Directory section (left sidebar, prominent)
- Grid view: Avatar | Name | Batch | Company | Role | CTA
- Advanced filtering: batch, stage, industry, expertise
- Live autocomplete search
- Browse by batch option

### 2. DUAL PROFILE SYSTEM
**Why it matters:** Founders wear two hats (personal + company)
**Implementation:**
```
One Account = Two Profiles:
├─ Personal Profile (/founder/[name])
│  └─ Posts about: personal insights, Q&A, networking
└─ Company Profile (/company/[slug])
   └─ Posts about: hiring, launches, fundraising updates

Profile Switcher in Account Menu:
"Switch to: Company Name ✓ / John Doe (personal)"

At post creation:
"Post as [Company] or [Personal]?" (explicit choice)
```

### 3. BATCH AS ORGANIZING PRINCIPLE
**Why it matters:** Shared cohort = immediate trust + shared context
**Implementation:**
- Every profile shows "S24" or "W24" badge prominently
- Filterable/searchable by batch
- Batch pages: dedicated section showing all companies in cohort
- "Your batch" recommendations
- Sub-communities within batches

### 4. THREADED DISCUSSIONS (NOT FLAT COMMENTS)
**Why it matters:** Complex Q&A requires structure
**Implementation:**
- Post types: Status, Question, Resource (not all same)
- Q&A posts invite "expert answers" (not just comments)
- Threads show "Resolved" state when solution found
- Quoted replies maintain context
- Expert tagging: "Get answer from X about Y"

### 5. QUALITY OVER VIRALITY
**Why it matters:** Bookface is honest-discussion space, not engagement-optimized
**Implementation:**
- No public like/reaction counts visible
- Quality signals (upvotes) more sophisticated
- Comments sorted by helpfulness, not recency
- Spam/low-quality content flagged by community
- Profile depth—one bad post doesn't define you

### 6. CURATED KNOWLEDGE BASE
**Why it matters:** YC content is core differentiator
**Implementation:**
- Separate "Knowledge Base" section (left sidebar)
- YC-authored playbooks, guides, interview transcripts
- Curated advice alongside user discussions
- Featured content has different visual treatment
- Community-authored + official content distinction

---

## 📋 Content Types & Interaction Patterns

| Content Type | Looks Like | Use Case | Interaction |
|--------------|-----------|----------|-------------|
| **Status Update** | "I'm hiring for..." / "We launched..." | Announcements, updates | Posts + comments |
| **Question** | "How do you approach retention?" | Seeking expertise | Threaded replies + expert answers |
| **Discussion** | "Best practices for fundraising?" | Collaborative exploration | Threaded Q&A format |
| **Resource** | Playbooks, guides, transcripts | Knowledge transfer | Bookface-curated, higher prominence |
| **Deal** | "YC discount: 20% off our analytics tool" | B2B marketplace | Browse/filter by company, industry |
| **Job Posting** | "Hiring: Backend engineer, series A" | Recruitment | Apply within network, tagged by batch |

---

## 🔍 Search & Discovery

### Multi-Dimensional Search
```
Global Search Bar (top nav)
↓
User types: "hiring" OR "Sarah" OR "Series B"
↓
Results show THREE categories:
├─ Members (Sarah Jones, S24, Acme Corp, "hiring manager")
├─ Content (5 discussions tagged "hiring")
└─ Companies (3 companies actively hiring)
```

### Advanced Filters (in Directory)
- Batch (S24, W24, S23, multi-select)
- Company stage (seed, Series A, B, C, later)
- Industry (fintech, AI/ML, healthcare, etc.)
- Expertise (searchable list)
- Location (optional)
- Active status (hiring, fundraising, etc.)

---

## 👤 Profile Structure

### Personal Founder Profile Page
```
HEADER
├─ Avatar (large)
├─ Name + Batch (S24)
├─ Title + Company
├─ Bio/Description

MAIN CONTENT
├─ Activity Feed (recent posts/comments)
├─ Expertise areas
├─ Links (website, Twitter, LinkedIn)
├─ Network (followers/connections within YC)

SIDEBAR CTAs
├─ Message
├─ Add to network
└─ Schedule meeting

PROFILE CARD (in directory grid)
├─ Avatar
├─ Name
├─ Batch
├─ Company + Role
└─ CTA: "Message" or "View Profile"
```

### Company Profile Page
```
HEADER
├─ Logo
├─ Company name + Batch founded
├─ Stage (Series A)
├─ Brief description

MAIN CONTENT
├─ Company updates (feed)
├─ Open jobs
├─ Deal/partnership offers
├─ Team members

SIDEBAR CTAs
├─ Message company
├─ Explore website
└─ View company directory
```

---

## 🚫 Common UX Pitfalls TO AVOID

| Problem | Why Bookface Works | Your Mitigation |
|---------|------------------|-----------------|
| **Creates monoculture** | YC-centric advice can be echo-chambery | Feature diverse viewpoints, not just "official" takes |
| **Advice is anecdotal** | Selection bias in founder base | Encourage context-sharing; label advice by applicability |
| **Search is hard at scale** | Need algorithm OR excellent filtering | Invest in advanced filters + directory prominence |
| **Privacy concerns** | Members fear confidential posts leaked | Clear privacy policies; distinction between public/private |
| **Low-quality posts** | Open feeds devolve into spam | Community moderation; quality signals; clear guidelines |
| **Reputation risk** | Single bad post visible to investors | Hide engagement metrics; emphasize depth over viral |
| **Needs critical mass** | Requires thousands of active members | Bootstrap with warm invite (don't start from zero) |

---

## 📐 Layout Checklist

### Top Navigation
- [ ] Logo/brand (clickable to feed)
- [ ] Global search bar (with autocomplete)
- [ ] User avatar (dropdown to account menu)
- [ ] Notification bell
- [ ] Dark mode toggle (optional)

### Left Sidebar
- [ ] Feed (home)
- [ ] Directory (members + companies)
- [ ] Knowledge Base (resources)
- [ ] Deals
- [ ] Jobs
- [ ] Batches
- [ ] Messages
- [ ] (Optional) Groups/Topics

### Account Menu (Top Right)
- [ ] Profile switcher ("Switch to: [Company]" / "[Personal]")
- [ ] Settings
- [ ] Notifications
- [ ] Privacy/Help
- [ ] Logout

### Feed View
- [ ] Post creation box (at top)
- [ ] Filter buttons (by batch, type, etc.)
- [ ] Individual posts (threaded)
- [ ] Featured/pinned content

### Directory View
- [ ] Search bar (with autocomplete)
- [ ] Filter panel (collapsible)
- [ ] View toggle (Grid / List / By Batch)
- [ ] Results grid with profile cards

### Post Component
- [ ] Author avatar + name
- [ ] "Posted as [Personal]" or "[Company]" label
- [ ] Post type badge (Question, Status, etc.)
- [ ] Batch badge
- [ ] Content body
- [ ] Comment count (NOT like count)
- [ ] "Comment" CTA (not "Like")

---

## 🎨 Visual Hierarchy Notes

### Information Priority
1. **Member identity** (avatar, name, batch)
2. **Context** (company, role, cohort)
3. **Trust signals** (batch, company stage)
4. **Action CTAs** (message, connect, view profile)
5. **Engagement** (comment count, NOT like count)

### Color/Styling Approach
- **Batch badges:** Distinct color per cohort (S24 = one color, W24 = another) for quick visual scanning
- **Profile types:** Subtle icon/badge distinction (founder 👤 vs company 🏢)
- **Quality signals:** Upvotes → visual prominence; low-quality → de-emphasized
- **CTAs:** Messaging/connection actions prominent; metrics minimal

---

## 🚀 Interaction Flows

### Discovery Flow
1. User opens Directory
2. Sees grid of member cards (avatar prominent)
3. Filters by batch or expertise
4. Clicks profile card → full profile page
5. Clicks "Message" → starts conversation

### Q&A Flow
1. User clicks "Ask Question"
2. Selects "Personal" or "Company" profile
3. Types question + optional context
4. Question appears in feed + Knowledge Base section
5. Experts reply with threaded answers
6. Asker can mark answer as "Resolved"

### Posting Flow
1. Click post creation area
2. Select post type: Status / Question / Resource
3. Select profile: Personal or Company
4. Write content
5. Add tags (batch, expertise area)
6. Publish → appears in feed

### Messaging Flow
1. Click "Messages" in sidebar
2. See thread list (founders + companies you've messaged)
3. Click thread → see conversation
4. Type reply + send
5. Notification appears for recipient

---

## 🔐 Trust & Moderation Model

**Bookface Trust Equation:**
```
Membership Gating (invite-only/YC verification) 
+ Shared Founder Context 
+ Brand Moderation (YC enforces norms) 
+ Real identity (no anonymity) 
+ Batch belonging (sub-communities) 
= High trust, low spam environment
```

**For your platform:**
- Clear membership criteria (who qualifies, why)
- Verify members before activation
- Establish community guidelines
- Empower members to report/flag low-quality content
- Leadership actively participates and models behavior
- Regular moderation reviews
- Don't hide behind algorithms (be transparent about rules)

---

## 💡 Features to Prioritize (in order)

### MVP (Must-have for Bookface-like feel)
1. Directory with advanced filters + search
2. Dual profile system (personal + company)
3. Threaded discussions (not flat comments)
4. Batch/cohort organization
5. Privacy (closed platform, verified members only)

### Phase 2 (Completes core experience)
6. Knowledge base (curated resources)
7. Messaging (direct founder connections)
8. Batch pages (dedicated cohort sections)
9. Job posting (within-network hiring)
10. Deals (B2B marketplace)

### Phase 3 (Polish)
11. Meeting scheduler
12. Investor reputation tracking
13. Mobile app
14. Advanced recommendations
15. Analytics for admins

### Features to Skip (not Bookface DNA)
- ❌ Algorithmic feed
- ❌ Public like counts
- ❌ Viral/share mechanics
- ❌ Anonymous posting
- ❌ Influencer profiles
- ❌ Monetization pressure

---

**Last Updated:** 2026-02-25
**Source:** Comprehensive YC Bookface research (proprietary platform analysis)
