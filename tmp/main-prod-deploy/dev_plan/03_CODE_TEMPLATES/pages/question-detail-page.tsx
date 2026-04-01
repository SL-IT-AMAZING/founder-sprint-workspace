'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { PageHeader } from '../components/page-header';
import { Card, CardBody, CardFooter } from '../components/card';
import { Button, SubmitButton } from '../components/button';
import { Textarea } from '../components/input';
import { StatusBadge, Badge } from '../components/badge';
import { Avatar } from '../components/avatar';
import { Modal } from '../components/modal';

interface Answer {
  id: string;
  body: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    role: 'founder' | 'mentor' | 'admin';
  };
  upvotesCount: number;
  isAccepted: boolean;
  createdAt: Date;
}

interface Question {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  status: 'open' | 'answered' | 'closed';
  isPublic: boolean;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  answers: Answer[];
  createdAt: Date;
  updatedAt: Date;
}

interface QuestionDetailPageProps {
  question: Question;
  currentUserId: string;
  currentUserRole: 'founder' | 'mentor' | 'admin';
  submitAnswer: (formData: FormData) => Promise<{ error?: string }>;
  markAsAnswered: (answerId: string) => Promise<{ error?: string }>;
  closeQuestion: () => Promise<{ error?: string }>;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function AnswerCard({ 
  answer, 
  isQuestionAuthor,
  onMarkAsAccepted,
}: { 
  answer: Answer;
  isQuestionAuthor: boolean;
  onMarkAsAccepted: () => void;
}) {
  return (
    <div className={`
      py-6 border-b border-[#2f2c251f] last:border-0
      ${answer.isAccepted ? 'bg-[#a9ee8120] -mx-6 px-6' : ''}
    `}>
      <div className="flex gap-4">
        <Avatar src={answer.author.avatarUrl} name={answer.author.name} size="md" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{answer.author.name}</span>
            {answer.author.role === 'mentor' && (
              <Badge size="sm" variant="info">Mentor</Badge>
            )}
            {answer.isAccepted && (
              <Badge size="sm" variant="success">Accepted</Badge>
            )}
            <span className="text-[11px] text-[#00000080]">
              {formatDate(answer.createdAt)}
            </span>
          </div>
          <div className="mt-3 prose prose-sm max-w-none">
            {answer.body.split('\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          {isQuestionAuthor && !answer.isAccepted && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="small"
                onClick={onMarkAsAccepted}
              >
                Mark as Answer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function QuestionDetailPage({
  question,
  currentUserId,
  currentUserRole,
  submitAnswer,
  markAsAnswered,
  closeQuestion,
}: QuestionDetailPageProps) {
  const [showCloseModal, setShowCloseModal] = useState(false);
  const isAuthor = question.author.id === currentUserId;
  const canAnswer = currentUserRole === 'mentor' || currentUserRole === 'admin' || !question.isPublic;
  const canClose = isAuthor || currentUserRole === 'admin';

  const [answerState, answerAction, answerPending] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await submitAnswer(formData);
      if (!result.error) {
        const form = document.getElementById('answer-form') as HTMLFormElement;
        form?.reset();
      }
      return result;
    },
    { error: undefined }
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={question.title}
        badge={
          <StatusBadge 
            status={question.status === 'answered' ? 'completed' : question.status === 'closed' ? 'archived' : 'pending'} 
          />
        }
        breadcrumbs={[
          { label: 'Questions', href: '/questions' },
          { label: question.title },
        ]}
        actions={
          canClose && question.status !== 'closed' && (
            <Button variant="outline" onClick={() => setShowCloseModal(true)}>
              Close Question
            </Button>
          )
        }
      />

      <Card>
        <CardBody className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar src={question.author.avatarUrl} name={question.author.name} size="md" />
            <div>
              <div className="font-medium">{question.author.name}</div>
              <div className="text-[11px] text-[#00000080]">
                Asked {formatDate(question.createdAt)}
                {question.updatedAt > question.createdAt && ' (edited)'}
              </div>
            </div>
          </div>
          
          <div className="prose prose-sm max-w-none">
            {question.body.split('\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          
          <div className="mt-4 flex gap-2">
            <Badge>{question.category}</Badge>
            {question.tags.map((tag) => (
              <Badge key={tag} variant="info">{tag}</Badge>
            ))}
            {!question.isPublic && <Badge variant="warning">Private</Badge>}
          </div>
        </CardBody>
      </Card>

      <div>
        <h2 className="text-[22px] leading-[1.25] tracking-[-0.02em] mb-4">
          {question.answers.length} {question.answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>

        {question.answers.length > 0 ? (
          <Card>
            <CardBody className="pt-6">
              {question.answers.map((answer) => (
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  isQuestionAuthor={isAuthor}
                  onMarkAsAccepted={() => markAsAnswered(answer.id)}
                />
              ))}
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="py-12 text-center">
              <p className="text-[#00000080]">No answers yet. Be the first to help!</p>
            </CardBody>
          </Card>
        )}
      </div>

      {question.status !== 'closed' && canAnswer && (
        <Card>
          <form id="answer-form" action={answerAction}>
            <CardBody className="pt-6">
              <h3 className="text-[18px] leading-[1.3] tracking-[-0.01em] mb-4">
                Your Answer
              </h3>
              <input type="hidden" name="questionId" value={question.id} />
              <Textarea
                name="body"
                placeholder="Write your answer here..."
                required
              />
              {answerState.error && (
                <p className="mt-2 text-sm text-[#ea384c]">{answerState.error}</p>
              )}
            </CardBody>
            <CardFooter>
              <SubmitButton pending={answerPending}>
                Post Answer
              </SubmitButton>
            </CardFooter>
          </form>
        </Card>
      )}

      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Close Question"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            Are you sure you want to close this question? This will prevent new answers from being posted.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowCloseModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await closeQuestion();
                setShowCloseModal(false);
              }}
            >
              Close Question
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default QuestionDetailPage;
