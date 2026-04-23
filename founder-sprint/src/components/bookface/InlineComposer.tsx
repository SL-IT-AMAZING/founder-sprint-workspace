"use client";

import React, { useState, useRef, useCallback } from 'react';
import { MentionTextarea, type ComposerMention } from '@/components/feed/MentionTextarea';
import { PostImagePicker } from '@/components/feed/PostImagePicker';

export interface InlineComposerProps {
  currentUser: {
    name: string | null;
    profileImage: string | null;
  };
  onSubmit: (data: {
    content: string;
    category?: string;
    mentions: ComposerMention[];
    files: File[];
    linkPreview?: { url: string; title: string; description?: string; imageUrl?: string; domain: string } | null;
  }) => Promise<{ success: boolean; error?: string }>;
  isPending?: boolean;
}

const CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'launch', label: 'Launch' },
  { id: 'classifieds', label: 'Classifieds' },
  { id: 'recruiting', label: 'Recruiting' },
];

const URL_REGEX = /(https?:\/\/[^\s]+)/;

const getInitials = (name: string | null): string => {
  if (!name) return "?";
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
};

const avatarStyle: React.CSSProperties = {
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  overflow: 'hidden',
  flexShrink: 0,
  backgroundColor: '#1A1A1A',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '14px',
  fontWeight: 600,
};

export const InlineComposer: React.FC<InlineComposerProps> = ({
  currentUser,
  onSubmit,
  isPending = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [mentions, setMentions] = useState<ComposerMention[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>('general');
  const composerRef = useRef<HTMLDivElement>(null);

  const hasUrl = URL_REGEX.test(content);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    setSubmitError(null);
    setTimeout(() => {
      composerRef.current?.querySelector("textarea")?.focus();
    }, 0);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || isPending) return;

    setSubmitError(null);

    const result = await onSubmit({
      content,
      category: selectedCategory,
      mentions,
      files: selectedFiles,
      linkPreview: null,
    });

    if (!result.success) {
      setSubmitError(result.error || 'Failed to create post.');
      return;
    }

    setContent('');
    setMentions([]);
    setSelectedFiles([]);
    setSelectedCategory('general');
    setIsExpanded(false);
    setSubmitError(null);
  }, [content, selectedCategory, mentions, selectedFiles, isPending, onSubmit]);

  const handleCancel = useCallback(() => {
    setContent('');
    setMentions([]);
    setSelectedFiles([]);
    setSelectedCategory('general');
    setSubmitError(null);
    setIsExpanded(false);
  }, []);

  const renderAvatar = () => (
    <div style={avatarStyle}>
      {currentUser.profileImage ? (
        <img
          src={currentUser.profileImage}
          alt={currentUser.name || 'User'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        getInitials(currentUser.name)
      )}
    </div>
  );

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={handleExpand}
        style={{
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E8E1D4',
          padding: '12px 14px',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {renderAvatar()}
          <div
            style={{
              flex: 1,
              padding: '11px 14px',
              backgroundColor: '#F6F2EA',
              borderRadius: '10px',
              border: '1px solid #EFE6D7',
              color: '#7A7468',
              fontSize: '15px',
              lineHeight: 1.4,
            }}
          >
            Write a post...
          </div>
        </div>
      </button>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E8E1D4',
        padding: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {renderAvatar()}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div ref={composerRef}>
            <MentionTextarea
              value={content}
              mentions={mentions}
              onChange={setContent}
              onMentionsChange={setMentions}
              placeholder="Write a post..."
              disabled={isPending}
              rows={5}
            />
          </div>

          {hasUrl && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                backgroundColor: '#F6F2EA',
                borderRadius: '8px',
                border: '1px solid #ECE3D5',
                fontSize: '12px',
                color: '#7A7468',
              }}
            >
              Link detected — preview support stays enabled after posting.
            </div>
          )}

          <PostImagePicker
            files={selectedFiles}
            onChange={setSelectedFiles}
            disabled={isPending}
          />

          {submitError && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                backgroundColor: 'rgba(198, 40, 40, 0.06)',
                borderRadius: '8px',
                border: '1px solid rgba(198, 40, 40, 0.2)',
                fontSize: '12px',
                color: '#a33a32',
              }}
            >
              {submitError}
            </div>
          )}

          <div
            style={{
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CATEGORIES.map((category) => {
                const isActive = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: '999px',
                      border: isActive ? '1px solid #2F2C26' : '1px solid #DDD4C4',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: isActive ? '#2F2C26' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#6E675B',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: '1px solid #DDD4C4',
                  backgroundColor: '#FFFFFF',
                  color: '#6E675B',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!content.trim() || isPending}
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: !content.trim() || isPending ? '#D3CBBE' : '#2F2C26',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: !content.trim() || isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
