"use client";

import { useActionState } from "react";
import { testAction } from "./action";

const initialState = {
  message: "",
  success: false,
};

export default function TestActionPage() {
  const [state, formAction, pending] = useActionState(testAction, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="max-w-md w-full p-8 bg-white rounded-lg border">
        <h1 className="text-2xl font-heading mb-6">Server Action Test</h1>
        
        <form action={formAction}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm mb-2">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full h-12 px-4 border rounded-md"
            />
          </div>
          
          <button
            type="submit"
            disabled={pending}
            className="w-full h-12 px-6 bg-dark text-white rounded-md disabled:opacity-50"
          >
            {pending ? "Submitting..." : "Submit"}
          </button>
        </form>

        {state.message && (
          <p className={`mt-4 p-3 rounded ${state.success ? "bg-green-100" : "bg-red-100"}`}>
            {state.message}
          </p>
        )}
      </div>
    </div>
  );
}
