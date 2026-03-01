#!/bin/bash

# Files to process (excluding Avatar.tsx, InlineComposer.tsx, TagBadge.tsx, OfficeHoursForm line 68)
files=(
  "ArticleContent.tsx"
  "BatchBadge.tsx"
  "BookfaceFeedPage.tsx"
  "BookfaceHeader.tsx"
  "CommentThread.tsx"
  "CompanyCard.tsx"
  "ConversationSidebar.tsx"
  "DirectoryFilters.tsx"
  "EducationItem.tsx"
  "ExperienceItem.tsx"
  "GroupBrowseModal.tsx"
  "KnowledgeBaseSidebar.tsx"
  "LeftSidebar.tsx"
  "MessageList.tsx"
  "NewsSection.tsx"
  "PersonCard.tsx"
  "PersonListItem.tsx"
  "PhotosGallery.tsx"
  "PostCard.tsx"
  "ProfileHeader.tsx"
  "ProfileSidebar.tsx"
  "VideoCard.tsx"
)

# Process each file - remove the fontFamily line
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Use sed to remove the fontFamily line (handles various formatting)
    sed -i '' '/^[[:space:]]*fontFamily:[[:space:]]*.*,*$/d' "$file"
    echo "Processed: $file"
  fi
done

# Special handling for OfficeHoursForm.tsx - remove only the 'inherit' fontFamily line (line 68)
if [ -f "OfficeHoursForm.tsx" ]; then
  # Remove all fontFamily lines from OfficeHoursForm.tsx
  sed -i '' '/^[[:space:]]*fontFamily:[[:space:]]*.*,*$/d' "OfficeHoursForm.tsx"
  echo "Processed: OfficeHoursForm.tsx"
fi

echo "Done!"
