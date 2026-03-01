import { getCurrentUser } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { QuestionForm } from "./QuestionForm";
import Link from "next/link";

export default async function NewQuestionPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Only founders and co-founders can create questions
  if (user.role !== "founder" && user.role !== "co_founder") {
    redirect("/questions");
  }

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <Link href="/questions" className="inline-flex items-center gap-2 mb-6 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
        <span>←</span>
        <span>Back to Questions</span>
      </Link>

      <div className="mb-8">
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26", marginBottom: "8px" }}>Ask a Question</h1>
        <p style={{ color: "var(--color-foreground-secondary)" }}>
          Get help from mentors and admins in your batch
        </p>
      </div>

      <QuestionForm />
    </div>
  );
}
