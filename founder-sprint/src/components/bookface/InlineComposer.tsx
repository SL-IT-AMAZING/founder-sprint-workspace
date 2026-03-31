"use client";

import React, { useState, useRef, useCallback } from 'react';

export interface InlineComposerProps {
  currentUser: {
    name: string | null;
    profileImage: string | null;
  };
  onSubmit: (data: { content: string; category?: string; linkPreview?: { url: string; title: string; description?: string; imageUrl?: string; domain: string } | null; imageUrls?: string[] }) => Promise<void>;
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
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>('general');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      imageUrls,
    });

    setContent('');
    setSelectedCategory('general');
    setImageUrls([]);
    setUploadError('');
    setIsExpanded(false);
  }, [content, selectedCategory, imageUrls, isPending, onSubmit]);

  const handleCancel = useCallback(() => {
    setContent('');
    setSelectedCategory('general');
    setImageUrls([]);
    setUploadError('');
    setIsExpanded(false);
  }, []);

  const handleImageSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const availableSlots = Math.max(0, 5 - imageUrls.length);
    const filesToUpload = files.slice(0, availableSlots);
    if (filesToUpload.length === 0) {
      setUploadError('You can attach up to 5 images per post.');
      event.target.value = '';
      return;
    }

    setIsUploadingImages(true);
    setUploadError('');

    try {
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'post-images');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();

        if (!response.ok || !result.success || !result.url) {
          throw new Error(result.error || 'Image upload failed');
        }

        uploadedUrls.push(result.url);
      }

      setImageUrls((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Image upload failed');
    } finally {
      setIsUploadingImages(false);
      event.target.value = '';
    }
  }, [imageUrls.length]);

  const handleRemoveImage = useCallback((imageUrl: string) => {
    setImageUrls((prev) => prev.filter((url) => url !== imageUrl));
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
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write a post..."
            style={{
              width: '100%',
              border: '1px solid #ECE3D5',
              outline: 'none',
              resize: 'vertical',
              borderRadius: '10px',
              padding: '12px 14px',
              backgroundColor: '#F8F5EE',
              fontSize: '15px',
              lineHeight: 1.55,
              minHeight: '110px',
              color: '#2F2C26',
            }}
          />

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

          {imageUrls.length > 0 && (
            <div
              style={{
                marginTop: '12px',
                display: 'grid',
                gridTemplateColumns: imageUrls.length === 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                gap: '10px',
              }}
            >
              {imageUrls.map((imageUrl) => (
                <div
                  key={imageUrl}
                  style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #E8E1D4',
                    backgroundColor: '#F8F5EE',
                    aspectRatio: '4 / 3',
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="Post upload preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(imageUrl)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '999px',
                      border: 'none',
                      backgroundColor: 'rgba(26,26,26,0.75)',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadError && (
            <div
              style={{
                marginTop: '10px',
                color: '#C62828',
                fontSize: '13px',
              }}
            >
              {uploadError}
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
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImages || imageUrls.length >= 5}
                style={{
                  padding: '5px 11px',
                  borderRadius: '999px',
                  border: '1px solid #DDD4C4',
                  cursor: isUploadingImages || imageUrls.length >= 5 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#FFFFFF',
                  color: '#6E675B',
                  opacity: isUploadingImages || imageUrls.length >= 5 ? 0.6 : 1,
                }}
              >
                {isUploadingImages ? 'Uploading…' : imageUrls.length > 0 ? 'Add photos' : 'Add photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
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
