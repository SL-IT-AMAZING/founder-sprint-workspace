'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PageHeader, SectionHeader } from '../components/page-header';
import { Card, CardBody } from '../components/card';
import { Button, ButtonLink } from '../components/button';
import { Input, Select } from '../components/input';
import { StatusBadge, Badge } from '../components/badge';
import { Avatar } from '../components/avatar';

interface Question {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  status: 'open' | 'answered' | 'closed';
  isPublic: boolean;
  answersCount: number;
  upvotesCount: number;
  author: {
    name: string;
    avatarUrl?: string;
  };
  createdAt: Date;
}

interface QuestionsListPageProps {
  questions: Question[];
  categories: Array<{ value: string; label: string }>;
  userRole: 'founder' | 'mentor' | 'admin';
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function QuestionCard({ question }: { question: Question }) {
  return (
    <Link href={`/questions/${question.id}`} className="block group">
      <div className="flex gap-6 py-6 border-b border-[#2f2c251f] last:border-0">
        <div className="flex flex-col items-center gap-1 w-16 text-center">
          <span className="text-[22px] leading-[1.25] tracking-[-0.02em]">
            {question.answersCount}
          </span>
          <span className="text-[11px] text-[#00000080]">
            {question.answersCount === 1 ? 'answer' : 'answers'}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-[18px] leading-[1.3] tracking-[-0.01em] group-hover:underline">
              {question.title}
            </h3>
            <StatusBadge 
              status={question.status === 'answered' ? 'completed' : question.status === 'closed' ? 'archived' : 'pending'} 
              size="sm" 
            />
          </div>
          
          <p className="mt-2 text-sm text-[#00000080] line-clamp-2">
            {question.body}
          </p>
          
          <div className="mt-3 flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-2">
              <Avatar src={question.author.avatarUrl} name={question.author.name} size="sm" />
              <span>{question.author.name}</span>
            </div>
            <span className="text-[#00000080]">{formatRelativeTime(question.createdAt)}</span>
            <div className="flex gap-2">
              <Badge size="sm">{question.category}</Badge>
              {question.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} size="sm" variant="info">{tag}</Badge>
              ))}
            </div>
            {!question.isPublic && (
              <span className="text-[#00000080]">Private</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function QuestionsListPage({ questions, categories, userRole }: QuestionsListPageProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const filteredQuestions = questions.filter((q) => {
    if (search && !q.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (category !== 'all' && q.category !== category) {
      return false;
    }
    if (status !== 'all' && q.status !== status) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Questions"
        description="Ask questions and get answers from mentors and fellow founders"
        actions={
          <ButtonLink href="/questions/new">
            Ask a Question
          </ButtonLink>
        }
      />

      <Card>
        <CardBody className="pt-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select
                options={[{ value: 'all', label: 'All Categories' }, ...categories]}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'open', label: 'Open' },
                  { value: 'answered', label: 'Answered' },
                  { value: 'closed', label: 'Closed' },
                ]}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[#00000080] mb-4">No questions found</p>
              <ButtonLink href="/questions/new" size="small">
                Ask the first question
              </ButtonLink>
            </div>
          ) : (
            <div>
              {filteredQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default QuestionsListPage;
