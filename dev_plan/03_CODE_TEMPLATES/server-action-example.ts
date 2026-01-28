"use server";

import { z } from "zod";

const ExampleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

type ActionState = {
  message: string;
  success: boolean;
};

export async function exampleAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    name: formData.get("name"),
  };

  const result = ExampleSchema.safeParse(rawData);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      message: firstError?.message || "Validation failed",
      success: false,
    };
  }

  return {
    message: `Success: ${result.data.name}`,
    success: true,
  };
}
