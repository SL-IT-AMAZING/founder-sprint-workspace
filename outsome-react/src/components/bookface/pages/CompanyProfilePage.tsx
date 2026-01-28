import React, { useState } from 'react';
import { BookfaceHeader } from '../BookfaceHeader';
import { ProfileHeader } from '../ProfileHeader';
import { ProfileSidebar } from '../ProfileSidebar';
import { NewsSection } from '../NewsSection';

const mockCompany = {
  name: 'Stripe',
  avatarUrl: 'https://logo.clearbit.com/stripe.com',
  batch: 'W09',
  description: `Stripe is a financial infrastructure platform for businesses. Millions of companies—from the world's largest enterprises to the most ambitious startups—use Stripe to accept payments, grow their revenue, and accelerate new business opportunities.

Headquartered in San Francisco and Dublin, the company aims to increase the GDP of the internet.`,
  mission: 'Increase the GDP of the internet by making it easy to start and run an internet business.',
  stats: {
    founded: '2010',
    employees: '8,000+',
    valuation: '$95B',
    funding: '$2.2B',
  },
};

const mockFounders = [
  { id: '1', name: 'Patrick Collison', role: 'CEO', avatarUrl: 'https://i.pravatar.cc/150?u=patrick', batch: 'W09' },
  { id: '2', name: 'John Collison', role: 'President', avatarUrl: 'https://i.pravatar.cc/150?u=john', batch: 'W09' },
];

const mockTeam = [
  { id: '3', name: 'Claire Hughes Johnson', role: 'COO', avatarUrl: 'https://i.pravatar.cc/150?u=claire' },
  { id: '4', name: 'Will Gaybrick', role: 'CFO', avatarUrl: 'https://i.pravatar.cc/150?u=will' },
  { id: '5', name: 'David Singleton', role: 'CTO', avatarUrl: 'https://i.pravatar.cc/150?u=davids' },
  { id: '6', name: 'Mike Moritz', role: 'Board Member', avatarUrl: 'https://i.pravatar.cc/150?u=mike' },
];

const mockJobs = [
  { id: '1', title: 'Senior Software Engineer', department: 'Engineering', location: 'San Francisco, CA', type: 'Full-time' },
  { id: '2', title: 'Product Manager', department: 'Product', location: 'New York, NY', type: 'Full-time' },
  { id: '3', title: 'Staff Machine Learning Engineer', department: 'AI/ML', location: 'Remote', type: 'Full-time' },
  { id: '4', title: 'Senior Designer', department: 'Design', location: 'San Francisco, CA', type: 'Full-time' },
  { id: '5', title: 'Technical Account Manager', department: 'Sales', location: 'London, UK', type: 'Full-time' },
  { id: '6', title: 'Infrastructure Engineer', department: 'Engineering', location: 'Dublin, Ireland', type: 'Full-time' },
];

const mockNews = [
  { id: '1', title: 'Stripe launches new payment links feature for small businesses', url: 'https://techcrunch.com', thumbnailUrl: 'https://picsum.photos/400/200?random=20', source: 'TechCrunch', publishedAt: '2024-01-20' },
  { id: '2', title: 'Stripe valuation reaches $95B in secondary market', url: 'https://bloomberg.com', thumbnailUrl: 'https://picsum.photos/400/200?random=21', source: 'Bloomberg', publishedAt: '2024-01-15' },
  { id: '3', title: 'How Stripe is powering the AI startup revolution', url: 'https://wired.com', thumbnailUrl: 'https://picsum.photos/400/200?random=22', source: 'Wired', publishedAt: '2024-01-10' },
];

const tabs = [
  { id: 'about', label: 'About' },
  { id: 'team', label: 'Team', count: mockFounders.length + mockTeam.length },
  { id: 'jobs', label: 'Jobs', count: mockJobs.length },
  { id: 'news', label: 'News', count: mockNews.length },
];

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#fefaf3',
    fontFamily: '"BDO Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '24px',
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: '24px',
  },
  main: {
    minWidth: 0,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    padding: '24px',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#2F2C26',
    margin: 0,
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e0e0e0',
  },
  description: {
    fontSize: '14px',
    color: '#2F2C26',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap' as const,
    marginBottom: '24px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  statItem: {
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#555AB9',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666666',
    textTransform: 'uppercase' as const,
  },
  teamGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  teamCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    gap: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  teamAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  teamInfo: {
    flex: 1,
    minWidth: 0,
  },
  teamName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2F2C26',
    marginBottom: '2px',
  },
  teamRole: {
    fontSize: '12px',
    color: '#666666',
  },
  founderBadge: {
    fontSize: '10px',
    backgroundColor: '#f1eadd',
    color: '#2F2C26',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '8px',
    fontWeight: 500,
  },
  jobItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#2F2C26',
    marginBottom: '4px',
  },
  jobMeta: {
    fontSize: '13px',
    color: '#666666',
  },
  applyButton: {
    padding: '8px 16px',
    backgroundColor: '#555AB9',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  sidebar: {
    position: 'sticky' as const,
    top: '88px',
    height: 'fit-content',
  },
};

export const CompanyProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('about');
  const [isFollowing, setIsFollowing] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>About</h2>
            <p style={styles.description}>{mockCompany.description}</p>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <div style={styles.statValue}>{mockCompany.stats.founded}</div>
                <div style={styles.statLabel}>Founded</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statValue}>{mockCompany.stats.employees}</div>
                <div style={styles.statLabel}>Employees</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statValue}>{mockCompany.stats.valuation}</div>
                <div style={styles.statLabel}>Valuation</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statValue}>{mockCompany.stats.funding}</div>
                <div style={styles.statLabel}>Total Funding</div>
              </div>
            </div>
          </div>
        );
      case 'team':
        return (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Founders</h2>
            <div style={styles.teamGrid}>
              {mockFounders.map((person) => (
                <div key={person.id} style={styles.teamCard}>
                  <img src={person.avatarUrl} alt={person.name} style={styles.teamAvatar} />
                  <div style={styles.teamInfo}>
                    <div style={styles.teamName}>
                      {person.name}
                      {person.batch && <span style={styles.founderBadge}>{person.batch}</span>}
                    </div>
                    <div style={styles.teamRole}>{person.role}</div>
                  </div>
                </div>
              ))}
            </div>
            <h2 style={{ ...styles.sectionTitle, marginTop: '32px' }}>Leadership Team</h2>
            <div style={styles.teamGrid}>
              {mockTeam.map((person) => (
                <div key={person.id} style={styles.teamCard}>
                  <img src={person.avatarUrl} alt={person.name} style={styles.teamAvatar} />
                  <div style={styles.teamInfo}>
                    <div style={styles.teamName}>{person.name}</div>
                    <div style={styles.teamRole}>{person.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'jobs':
        return (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Open Positions</h2>
            {mockJobs.map((job) => (
              <div key={job.id} style={styles.jobItem}>
                <div style={styles.jobInfo}>
                  <div style={styles.jobTitle}>{job.title}</div>
                  <div style={styles.jobMeta}>{job.department} · {job.location} · {job.type}</div>
                </div>
                <button style={styles.applyButton}>Apply</button>
              </div>
            ))}
          </div>
        );
      case 'news':
        return (
          <div style={styles.section}>
            <NewsSection articles={mockNews} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.page}>
      <BookfaceHeader userName="John Doe" userAvatarUrl="https://i.pravatar.cc/150?u=johndoe" notificationCount={3} />
      
      <ProfileHeader
        type="company"
        name={mockCompany.name}
        avatarUrl={mockCompany.avatarUrl}
        batch={mockCompany.batch}
        isFollowing={isFollowing}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onFollowClick={() => setIsFollowing(!isFollowing)}
        onMessageClick={() => console.log('Message company')}
      />
      
      <div style={styles.container}>
        <main style={styles.main}>
          {renderContent()}
        </main>
        
        <aside style={styles.sidebar}>
          <ProfileSidebar
            type="company"
            founded={2010}
            employees={8000}
            locations={['San Francisco, CA', 'Dublin, Ireland']}
            website="https://stripe.com"
            email="jobs@stripe.com"
            socialLinks={{
              linkedin: 'https://linkedin.com/company/stripe',
              twitter: 'https://twitter.com/stripe',
              github: 'https://github.com/stripe',
            }}
            onShowContactInfo={() => console.log('Show contact info')}
            onReportSpam={() => console.log('Report spam')}
            onBookmark={() => console.log('Bookmark')}
          />
        </aside>
      </div>
    </div>
  );
};
