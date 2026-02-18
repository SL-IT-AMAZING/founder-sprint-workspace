"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";

export async function getUserBatches(): Promise<
  ActionResult<Array<{ batchId: string; batchName: string; role: string; batchStatus: string; endDate: Date }>>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.email) return { success: false, error: "Not authenticated" };
    const authEmail = authUser.email;

    const user = await prisma.user.findUnique({
      where: { email: authEmail },
      include: {
        userBatches: {
          where: { status: "active" },
          include: { batch: true },
          orderBy: { batch: { createdAt: "desc" } },
        },
      },
    });

    if (!user) return { success: false, error: "User not found" };

    const batches = user.userBatches.map((ub) => ({
      batchId: ub.batchId,
      batchName: ub.batch.name,
      role: ub.role,
      batchStatus: ub.batch.status,
      endDate: ub.batch.endDate,
    }));

    return { success: true, data: batches };
  } catch (error) {
    console.error("Failed to get user batches:", error);
    return { success: false, error: "Failed to get user batches" };
  }
}

export async function switchBatch(batchId: string): Promise<ActionResult<undefined>> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.email) return { success: false, error: "Not authenticated" };
    const authEmail = authUser.email;

    // Verify user belongs to this batch
    const user = await prisma.user.findUnique({
      where: { email: authEmail },
      include: {
        userBatches: {
          where: { batchId, status: "active" },
          take: 1,
        },
      },
    });

    if (!user || user.userBatches.length === 0) {
      return { success: false, error: "You do not belong to this batch" };
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("selected_batch_id", batchId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === "production",
    });

    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to switch batch:", error);
    return { success: false, error: "Failed to switch batch" };
  }
}
