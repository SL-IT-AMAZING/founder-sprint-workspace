"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-12 px-6 bg-dark text-cream rounded-md font-medium disabled:opacity-50"
    >
      {pending ? "Loading..." : children}
    </button>
  );
}
