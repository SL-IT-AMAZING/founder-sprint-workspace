import { getCurrentUser } from "@/lib/permissions";
import { getQuestions } from "@/actions/question";
import { redirect } from "next/navigation";
import { QuestionsList } from "./QuestionsList";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export const revalidate = 60;

export default async function QuestionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const questions = await getQuestions(user.batchId);
  const canAskQuestion = user.role === "founder" || user.role === "co_founder";

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Questions</h1>
          <p style={{ color: "var(--color-foreground-secondary)" }}>
            Ask questions and get answers from mentors and admins
          </p>
        </div>
        {canAskQuestion && (
          <Link href="/questions/new">
            <Button>Ask Question</Button>
          </Link>
        )}
      </div>

      <QuestionsList questions={questions} />
    </div>
  );
}
