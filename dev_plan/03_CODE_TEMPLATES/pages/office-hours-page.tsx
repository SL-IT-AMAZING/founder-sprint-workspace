'use client';

import { useState } from 'react';
import { PageHeader, SectionHeader } from '../components/page-header';
import { Card, CardBody, CardFooter } from '../components/card';
import { Button, ButtonLink } from '../components/button';
import { Badge, StatusBadge } from '../components/badge';
import { Avatar } from '../components/avatar';
import { Modal } from '../components/modal';

interface OfficeHoursSession {
  id: string;
  title: string;
  description?: string;
  mentor: {
    id: string;
    name: string;
    avatarUrl?: string;
    title?: string;
  };
  startTime: Date;
  endTime: Date;
  capacity: number;
  registeredCount: number;
  meetingUrl?: string;
  isRegistered: boolean;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
}

interface OfficeHoursPageProps {
  sessions: OfficeHoursSession[];
  userRole: 'founder' | 'mentor' | 'admin';
  onRegister: (sessionId: string) => Promise<{ error?: string }>;
  onUnregister: (sessionId: string) => Promise<{ error?: string }>;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

function SessionCard({
  session,
  userRole,
  onRegister,
  onUnregister,
}: {
  session: OfficeHoursSession;
  userRole: 'founder' | 'mentor' | 'admin';
  onRegister: () => void;
  onUnregister: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const isFull = session.registeredCount >= session.capacity;
  const spotsLeft = session.capacity - session.registeredCount;

  const statusBadge = {
    upcoming: <Badge variant="info">Upcoming</Badge>,
    live: <Badge variant="success">Live Now</Badge>,
    completed: <Badge variant="default">Completed</Badge>,
    cancelled: <Badge variant="error">Cancelled</Badge>,
  }[session.status];

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardBody className="pt-6 flex-1">
          <div className="flex items-start gap-4">
            <Avatar src={session.mentor.avatarUrl} name={session.mentor.name} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {statusBadge}
              </div>
              <h3 className="text-[18px] leading-[1.3] tracking-[-0.01em] truncate">
                {session.title}
              </h3>
              <p className="text-sm text-[#00000080] mt-1">
                with {session.mentor.name}
                {session.mentor.title && ` - ${session.mentor.title}`}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-50">
                <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5.5 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M10.5 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>{formatDate(session.startTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-50">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>{formatTimeRange(session.startTime, session.endTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-50">
                <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 14C2 11.2386 4.68629 9 8 9C11.3137 9 14 11.2386 14 14" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>
                {session.registeredCount}/{session.capacity} registered
                {spotsLeft <= 3 && spotsLeft > 0 && (
                  <span className="text-[#ea384c] ml-1">({spotsLeft} spots left)</span>
                )}
              </span>
            </div>
          </div>

          {session.description && (
            <p className="mt-4 text-sm text-[#00000080] line-clamp-2">
              {session.description}
            </p>
          )}
        </CardBody>

        <CardFooter className="flex gap-3">
          {session.status === 'upcoming' && (
            <>
              {session.isRegistered ? (
                <>
                  <Button variant="outline" onClick={onUnregister} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={() => setShowDetails(true)} className="flex-1">
                    View Details
                  </Button>
                </>
              ) : (
                <Button
                  onClick={onRegister}
                  disabled={isFull}
                  className="flex-1"
                >
                  {isFull ? 'Session Full' : 'Register'}
                </Button>
              )}
            </>
          )}
          {session.status === 'live' && session.isRegistered && session.meetingUrl && (
            <ButtonLink href={session.meetingUrl} className="flex-1">
              Join Meeting
            </ButtonLink>
          )}
          {session.status === 'completed' && (
            <Button variant="outline" disabled className="flex-1">
              Completed
            </Button>
          )}
        </CardFooter>
      </Card>

      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={session.title}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar src={session.mentor.avatarUrl} name={session.mentor.name} size="lg" />
            <div>
              <div className="font-medium">{session.mentor.name}</div>
              {session.mentor.title && (
                <div className="text-sm text-[#00000080]">{session.mentor.title}</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <div><strong>Date:</strong> {formatDate(session.startTime)}</div>
            <div><strong>Time:</strong> {formatTimeRange(session.startTime, session.endTime)}</div>
            <div><strong>Spots:</strong> {session.registeredCount}/{session.capacity}</div>
          </div>

          {session.description && (
            <div>
              <strong className="text-sm">Description:</strong>
              <p className="text-sm text-[#00000080] mt-1">{session.description}</p>
            </div>
          )}

          {session.isRegistered && session.meetingUrl && (
            <div className="pt-4 border-t border-[#2f2c251f]">
              <p className="text-sm text-[#00000080] mb-2">
                You are registered! Join using the link below when the session starts.
              </p>
              <ButtonLink href={session.meetingUrl} className="w-full">
                Join Meeting
              </ButtonLink>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

export function OfficeHoursPage({
  sessions,
  userRole,
  onRegister,
  onUnregister,
}: OfficeHoursPageProps) {
  const upcomingSessions = sessions.filter(s => s.status === 'upcoming' || s.status === 'live');
  const pastSessions = sessions.filter(s => s.status === 'completed' || s.status === 'cancelled');
  const mySessions = sessions.filter(s => s.isRegistered);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Office Hours"
        description="Book 1:1 sessions with mentors to get personalized advice"
        actions={
          userRole === 'admin' && (
            <ButtonLink href="/office-hours/new">
              Create Session
            </ButtonLink>
          )
        }
      />

      {mySessions.length > 0 && (
        <div>
          <SectionHeader title="My Sessions" size="sm" />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mySessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                userRole={userRole}
                onRegister={() => onRegister(session.id)}
                onUnregister={() => onUnregister(session.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionHeader title="Upcoming Sessions" size="sm" />
        {upcomingSessions.length === 0 ? (
          <Card className="mt-4">
            <CardBody className="py-12 text-center">
              <p className="text-[#00000080]">No upcoming sessions scheduled.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                userRole={userRole}
                onRegister={() => onRegister(session.id)}
                onUnregister={() => onUnregister(session.id)}
              />
            ))}
          </div>
        )}
      </div>

      {pastSessions.length > 0 && (
        <div>
          <SectionHeader title="Past Sessions" size="sm" />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastSessions.slice(0, 6).map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                userRole={userRole}
                onRegister={() => onRegister(session.id)}
                onUnregister={() => onUnregister(session.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default OfficeHoursPage;
