"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime, truncate, getDisplayName } from "@/lib/utils";

interface Question {
  id: string;
  title: string;
  content: string;
  status: "open" | "closed";
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
  };
  _count: {
    answers: number;
  };
  summary: {
    id: string;
  } | null;
}

interface QuestionsListProps {
  questions: Question[];
}

export function QuestionsList({ questions }: QuestionsListProps) {
  const QuestionCard = ({ question }: { question: Question }) => (
    <Link href={`/questions/${question.id}`} className="block">
      <div
        className="card"
        style={{
          borderLeft: question.status === "open" ? "3px solid var(--color-success)" : "3px solid var(--color-warning)",
        }}
      >
        <div className="flex gap-4">
          <Avatar src={question.author.profileImage} name={getDisplayName(question.author)} size={48} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2">
              <h3 className="text-lg font-semibold">{question.title}</h3>
              <div className="self-start">
                <Badge variant={question.status === "open" ? "success" : "warning"}>
                  {question.status === "open" ? "Open" : "Closed"}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
              <span className="font-medium">{getDisplayName(question.author)}</span>
              <span>•</span>
              <span>{formatRelativeTime(question.createdAt)}</span>
            </div>
            <p className="mb-3" style={{ color: "var(--color-foreground-secondary)" }}>
              {truncate(question.content, 200)}
            </p>
            <div className="flex items-center gap-4 text-sm" style={{ color: "var(--color-foreground-muted)" }}>
              <span>{question._count.answers} {question._count.answers === 1 ? "answer" : "answers"}</span>
              {question.summary && (
                <>
                  <span>•</span>
                  <span style={{ color: "var(--color-success)" }}>Summarized</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  const QuestionList = ({ questions }: { questions: Question[] }) => {
    if (questions.length === 0) {
      return (
        <EmptyState
          title="No questions found"
          description="Be the first to ask a question!"
        />
      );
    }

    return (
      <div className="space-y-4">
        {questions.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>
    );
  };

  const allQuestions = questions;
  const openQuestions = questions.filter((q) => q.status === "open");
  const closedQuestions = questions.filter((q) => q.status === "closed");

  const tabs = [
    {
      key: "all",
      label: `All (${allQuestions.length})`,
      content: <QuestionList questions={allQuestions} />,
    },
    {
      key: "open",
      label: `Open (${openQuestions.length})`,
      content: <QuestionList questions={openQuestions} />,
    },
    {
      key: "closed",
      label: `Closed (${closedQuestions.length})`,
      content: <QuestionList questions={closedQuestions} />,
    },
  ];

  return <Tabs tabs={tabs} defaultTab="all" />;
}
