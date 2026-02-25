"use client";

import React, { useState, useRef, useCallback } from 'react';

export interface InlineComposerProps {
  currentUser: {
    name: string | null;
    profileImage: string | null;
  };
  onSubmit: (data: { content: string; category?: string; linkPreview?: { url: string; title: string; description?: string; imageUrl?: string; domain: string } | null }) => Promise<void>;
  isPending?: boolean;
}

const CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'launch', label: 'Launch' },
  { id: 'classifieds', label: 'Classifieds' },
  { id: 'recruiting', label: 'Recruiting' },
];

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const getInitials = (name: string | null): string => {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

export const InlineComposer: React.FC<InlineComposerProps> = ({ 
  currentUser, 
  onSubmit, 
  isPending = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>('general');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasUrl = URL_REGEX.test(content);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || isPending) return;

    await onSubmit({
      content,
      category: selectedCategory,
      linkPreview: null,
    });

    setContent('');
    setSelectedCategory('general');
    setIsExpanded(false);
  }, [content, selectedCategory, isPending, onSubmit]);

  const handleCancel = useCallback(() => {
    setContent('');
    setSelectedCategory('general');
    setIsExpanded(false);
  }, []);

  if (!isExpanded) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          padding: '16px',
          cursor: 'pointer',
        }}
        onClick={handleExpand}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
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
            }}
          >
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

          <div
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: '#f0f2f5',
              borderRadius: '8px',
              color: '#65676b',
              fontSize: '14px',
            }}
          >
            What are you working on?
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
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
          }}
        >
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

        <div style={{ flex: 1, backgroundColor: '#f8f8f8', borderRadius: '8px', padding: '12px', border: '1px solid #e8e8e8' }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What are you working on?"
            style={{
              border: 'none',
              outline: 'none',
              resize: 'none',
              width: '100%',
              fontSize: '14px',
              lineHeight: 1.5,
              minHeight: '80px',
            }}
          />

          {hasUrl && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#f0f2f5',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#65676b',
              }}
            >
              🔗 Link detected
            </div>
          )}

          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CATEGORIES.map((category) => {
                const isActive = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      border: isActive ? '1px solid #1A1A1A' : '1px solid #d0d0d0',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      backgroundColor: isActive ? '#1A1A1A' : 'white',
                      color: isActive ? 'white' : '#555',
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
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  backgroundColor: 'white',
                  color: '#555',
                  fontSize: '14px',
                  fontWeight: 500,
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
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: !content.trim() || isPending ? '#cccccc' : '#1A1A1A',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
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
