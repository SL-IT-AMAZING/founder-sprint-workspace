"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface ComposerMention {
  userId: string;
  displayText: string;
  startIndex: number;
  endIndex: number;
}

interface MentionUserResult {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
}

interface MentionTextareaProps {
  value: string;
  mentions: ComposerMention[];
  onChange: (value: string) => void;
  onMentionsChange: (mentions: ComposerMention[]) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

function isMentionBoundary(charBefore: string | undefined): boolean {
  if (!charBefore) return true;
  return /[\s([{'"“”‘’.,!?;:]/.test(charBefore);
}

function getMentionContext(text: string, caretIndex: number) {
  const prefix = text.slice(0, caretIndex);
  const atIndex = prefix.lastIndexOf("@");
  if (atIndex === -1) return null;

  const charBefore = atIndex > 0 ? prefix[atIndex - 1] : undefined;
  if (!isMentionBoundary(charBefore)) return null;

  const query = prefix.slice(atIndex + 1);
  if (query.includes("\n") || /\s/.test(query)) return null;

  return {
    startIndex: atIndex,
    endIndex: caretIndex,
    query,
  };
}

function reconcileMentions(text: string, mentions: ComposerMention[]): ComposerMention[] {
  const nextMentions: ComposerMention[] = [];
  let searchFrom = 0;

  for (const mention of [...mentions].sort((a, b) => a.startIndex - b.startIndex)) {
    const token = `@${mention.displayText}`;
    const index = text.indexOf(token, searchFrom);
    if (index === -1) continue;

    nextMentions.push({
      ...mention,
      startIndex: index,
      endIndex: index + token.length,
    });
    searchFrom = index + token.length;
  }

  return nextMentions;
}

export function MentionTextarea({
  value,
  mentions,
  onChange,
  onMentionsChange,
  placeholder = "Write a post...",
  disabled = false,
  rows = 5,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ignoreNextKeyUpRef = useRef(false);
  const listboxId = useId();
  const [context, setContext] = useState<{
    startIndex: number;
    endIndex: number;
    query: string;
  } | null>(null);
  const [results, setResults] = useState<MentionUserResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const isOpen = Boolean(context && context.query.length > 0 && results.length > 0);
  const activeOption = isOpen ? results[activeIndex] : null;

  useEffect(() => {
    if (!context || context.query.trim().length < 1) {
      setResults([]);
      setLoading(false);
      setActiveIndex(0);
      return;
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/users/mention-search?q=${encodeURIComponent(context.query.trim())}`
        );
        if (!response.ok) throw new Error("Mention search failed");
        const data = (await response.json()) as { users?: MentionUserResult[] };
        if (!isCancelled) {
          setResults(data.users ?? []);
          setActiveIndex(0);
        }
      } catch {
        if (!isCancelled) {
          setResults([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }, 150);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [context]);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    onChange(nextValue);
    onMentionsChange(reconcileMentions(nextValue, mentions));

    const nextContext = getMentionContext(nextValue, event.target.selectionStart ?? nextValue.length);
    setContext(nextContext);
  };

  const selectMention = (user: MentionUserResult) => {
    if (!context) return;

    const displayText = user.name?.trim() || user.email;
    const mentionToken = `@${displayText} `;
    const nextValue =
      value.slice(0, context.startIndex) +
      mentionToken +
      value.slice(context.endIndex);

    const baseMentions = mentions.filter(
      (mention) =>
        mention.endIndex <= context.startIndex || mention.startIndex >= context.endIndex
    );
    const reconciled = reconcileMentions(nextValue, baseMentions);
    const insertedMention: ComposerMention = {
      userId: user.id,
      displayText,
      startIndex: context.startIndex,
      endIndex: context.startIndex + mentionToken.trimEnd().length,
    };

    onChange(nextValue);
    onMentionsChange(
      [...reconciled, insertedMention].sort((a, b) => a.startIndex - b.startIndex)
    );
    setContext(null);
    setResults([]);
    setActiveIndex(0);

    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      const cursorIndex = context.startIndex + mentionToken.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(cursorIndex, cursorIndex);
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!context || isComposing || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      ignoreNextKeyUpRef.current = true;
      const selected = results[activeIndex];
      if (selected) selectMention(selected);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      ignoreNextKeyUpRef.current = true;
      setContext(null);
      setResults([]);
      setActiveIndex(0);
    }
  };

  const helperText = useMemo(() => {
    if (!context) return null;
    if (loading) return "Searching people…";
    if (context.query.length < 1) return "Type a name or email after @";
    if (results.length === 0) return "No matching people";
    return null;
  }, [context, loading, results.length]);

  return (
    <div style={{ position: "relative" }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onClick={(event) => setContext(getMentionContext(event.currentTarget.value, event.currentTarget.selectionStart ?? value.length))}
        onKeyUp={(event) => {
          if (ignoreNextKeyUpRef.current) {
            ignoreNextKeyUpRef.current = false;
            return;
          }
          setContext(getMentionContext(event.currentTarget.value, event.currentTarget.selectionStart ?? value.length));
        }}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={(event) => {
          setIsComposing(false);
          setContext(getMentionContext(event.currentTarget.value, event.currentTarget.selectionStart ?? value.length));
        }}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={activeOption ? `${listboxId}-${activeOption.id}` : undefined}
        aria-autocomplete="list"
        style={{
          width: "100%",
          border: "1px solid #ECE3D5",
          outline: "none",
          resize: "vertical",
          borderRadius: "10px",
          padding: "12px 14px",
          backgroundColor: "#F8F5EE",
          fontSize: "15px",
          lineHeight: 1.55,
          minHeight: "110px",
          color: "#2F2C26",
        }}
      />

      {(isOpen || helperText) && (
        <div
          id={listboxId}
          role="listbox"
          style={{
            marginTop: "10px",
            border: "1px solid #E8E1D4",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            overflow: "hidden",
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {helperText && !isOpen ? (
            <div
              style={{
                padding: "12px 14px",
                fontSize: "13px",
                color: "#7A7468",
              }}
            >
              {helperText}
            </div>
          ) : (
            results.map((user, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={user.id}
                  id={`${listboxId}-${user.id}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectMention(user);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 14px",
                    border: "none",
                    backgroundColor: isActive ? "#F8F5EE" : "#FFFFFF",
                    textAlign: "left",
                    cursor: "pointer",
                    borderBottom:
                      index < results.length - 1 ? "1px solid #F1ECE2" : "none",
                  }}
                >
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name || user.email}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "#1A1A1A",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {(user.name || user.email)[0]?.toUpperCase()}
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#2F2C26",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user.name || user.email}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#7A7468",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user.email}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
