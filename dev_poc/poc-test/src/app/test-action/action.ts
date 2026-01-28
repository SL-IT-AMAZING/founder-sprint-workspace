"use server";

import { z } from "zod";

const TestSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

type ActionState = {
  message: string;
  success: boolean;
};

export async function testAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    name: formData.get("name"),
  };

  const result = TestSchema.safeParse(rawData);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      message: firstError?.message || "Validation failed",
      success: false,
    };
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    message: `Hello, ${result.data.name}!`,
    success: true,
  };
}
