"use client";

import { useActionState } from "react";
import { exampleAction } from "./server-action-example";

const initialState = {
  message: "",
  success: false,
};

export default function ExampleForm() {
  const [state, formAction, pending] = useActionState(exampleAction, initialState);

  return (
    <form action={formAction}>
      <input
        type="text"
        name="name"
        required
        className="w-full h-12 px-4 border rounded-md"
      />
      
      <button
        type="submit"
        disabled={pending}
        className="w-full h-12 px-6 bg-dark text-white rounded-md disabled:opacity-50"
      >
        {pending ? "Submitting..." : "Submit"}
      </button>

      {state.message && (
        <p className={state.success ? "text-green-600" : "text-red-600"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
