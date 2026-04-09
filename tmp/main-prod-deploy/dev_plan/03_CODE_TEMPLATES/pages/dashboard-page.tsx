'use client';

import Link from 'next/link';
import { PageHeader, SectionHeader } from '../components/page-header';
import { Card, CardBody, Widget } from '../components/card';
import { Button, ButtonLink } from '../components/button';
import { StatusBadge } from '../components/badge';
import { Avatar, AvatarGroup } from '../components/avatar';

interface DashboardStats {
  questionsAsked: number;
  questionsAnswered: number;
  upcomingSessions: number;
  assignmentsCompleted: number;
  totalAssignments: number;
}

interface UpcomingSession {
  id: string;
  title: string;
  mentorName: string;
  mentorAvatar?: string;
  startTime: Date;
  isRegistered: boolean;
}

interface RecentQuestion {
  id: string;
  title: string;
  status: 'pending' | 'answered';
  answersCount: number;
  createdAt: Date;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: Date;
  status: 'not_started' | 'in_progress' | 'submitted' | 'reviewed';
}

interface DashboardPageProps {
  user: {
    name: string;
    cohortName: string;
  };
  stats: DashboardStats;
  upcomingSessions: UpcomingSession[];
  recentQuestions: RecentQuestion[];
  assignments: Assignment[];
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function StatCard({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const content = (
    <Widget className="h-full">
      <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#00000080]">
        {label}
      </div>
      <div className="text-[35px] leading-[1.1] tracking-[-0.02em]">
        {value}
      </div>
    </Widget>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

export function DashboardPage({
  user,
  stats,
  upcomingSessions,
  recentQuestions,
  assignments,
}: DashboardPageProps) {
  const pendingAssignments = assignments.filter(
    a => a.status === 'not_started' || a.status === 'in_progress'
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        description={`${user.cohortName} - Keep up the great work!`}
      />

      <div className="grid grid-cols-4 gap-6">
        <StatCard 
          label="Questions Asked" 
          value={stats.questionsAsked}
          href="/questions"
        />
        <StatCard 
          label="Questions Answered" 
          value={stats.questionsAnswered}
          href="/questions"
        />
        <StatCard 
          label="Upcoming Sessions" 
          value={stats.upcomingSessions}
          href="/office-hours"
        />
        <StatCard 
          label="Assignments Done" 
          value={`${stats.assignmentsCompleted}/${stats.totalAssignments}`}
          href="/assignments"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardBody className="pt-6">
            <SectionHeader
              title="Upcoming Office Hours"
              size="sm"
              actions={
                <ButtonLink href="/office-hours" variant="outline" size="small">
                  View All
                </ButtonLink>
              }
            />
            
            {upcomingSessions.length === 0 ? (
              <div className="py-8 text-center text-[#00000080]">
                No upcoming sessions. Check the calendar to register!
              </div>
            ) : (
              <ul className="mt-4 flex flex-col divide-y divide-[#2f2c251f]">
                {upcomingSessions.map((session) => (
                  <li key={session.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={session.mentorAvatar}
                        name={session.mentorName}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">
                          {session.title}
                        </h4>
                        <p className="text-[11px] text-[#00000080] mt-0.5">
                          with {session.mentorName}
                        </p>
                        <p className="text-[11px] text-[#00000080]">
                          {formatDate(session.startTime)}
                        </p>
                      </div>
                      {session.isRegistered ? (
                        <StatusBadge status="active" size="sm" />
                      ) : (
                        <ButtonLink href={`/office-hours/${session.id}`} size="small" variant="outline">
                          Register
                        </ButtonLink>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6">
            <SectionHeader
              title="Pending Assignments"
              size="sm"
              actions={
                <ButtonLink href="/assignments" variant="outline" size="small">
                  View All
                </ButtonLink>
              }
            />
            
            {pendingAssignments.length === 0 ? (
              <div className="py-8 text-center text-[#00000080]">
                All assignments completed! Great job!
              </div>
            ) : (
              <ul className="mt-4 flex flex-col divide-y divide-[#2f2c251f]">
                {pendingAssignments.slice(0, 4).map((assignment) => (
                  <li key={assignment.id} className="py-4 first:pt-0 last:pb-0">
                    <Link 
                      href={`/assignments/${assignment.id}`}
                      className="flex items-center justify-between gap-4 group"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate group-hover:underline">
                          {assignment.title}
                        </h4>
                        <p className="text-[11px] text-[#00000080] mt-0.5">
                          Due {formatDate(assignment.dueDate)}
                        </p>
                      </div>
                      <StatusBadge 
                        status={assignment.status === 'not_started' ? 'draft' : 'pending'} 
                        size="sm" 
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="pt-6">
          <SectionHeader
            title="Recent Questions"
            size="sm"
            actions={
              <div className="flex gap-3">
                <ButtonLink href="/questions/new" size="small">
                  Ask Question
                </ButtonLink>
                <ButtonLink href="/questions" variant="outline" size="small">
                  View All
                </ButtonLink>
              </div>
            }
          />
          
          {recentQuestions.length === 0 ? (
            <div className="py-8 text-center text-[#00000080]">
              No questions yet. Ask your first question to get help from mentors!
            </div>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-[#2f2c251f]">
              {recentQuestions.map((question) => (
                <li key={question.id} className="py-4 first:pt-0 last:pb-0">
                  <Link 
                    href={`/questions/${question.id}`}
                    className="flex items-center justify-between gap-4 group"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate group-hover:underline">
                        {question.title}
                      </h4>
                      <p className="text-[11px] text-[#00000080] mt-0.5">
                        {question.answersCount} answers - {formatDate(question.createdAt)}
                      </p>
                    </div>
                    <StatusBadge 
                      status={question.status === 'answered' ? 'completed' : 'pending'} 
                      size="sm" 
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default DashboardPage;
