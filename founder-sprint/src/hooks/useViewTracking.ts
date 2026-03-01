"use client";

import { useRef, useCallback } from "react";
import { trackPostView } from "@/actions/view-tracking";

export function useViewTracking() {
  const trackedPosts = useRef(new Set<string>());
  const timers = useRef(new Map<Element, ReturnType<typeof setTimeout>>());

  const trackView = useCallback((postId: string) => {
    if (trackedPosts.current.has(postId)) return;
    trackedPosts.current.add(postId);
    trackPostView(postId);
  }, []);

  const createObserver = useCallback(() => {
    if (typeof window === "undefined") return null;

    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute("data-post-id");
            if (postId) {
              const timer = setTimeout(() => {
                trackView(postId);
              }, 2000);
              timers.current.set(entry.target, timer);
            }
          } else {
            const timer = timers.current.get(entry.target);
            if (timer) {
              clearTimeout(timer);
              timers.current.delete(entry.target);
            }
          }
        });
      },
      { threshold: 0.5 }
    );
  }, [trackView]);

  return { createObserver };
}
