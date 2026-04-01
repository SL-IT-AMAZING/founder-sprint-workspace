import React, { useState } from 'react';
import { BookfaceHeader } from '../BookfaceHeader';
import { ProfileHeader } from '../ProfileHeader';
import { ProfileSidebar } from '../ProfileSidebar';
import { ExperienceItem } from '../ExperienceItem';
import { EducationItem } from '../EducationItem';
import { NewsSection } from '../NewsSection';
import { PhotosGallery } from '../PhotosGallery';

const mockUser = {
  name: 'Sarah Chen',
  username: 'sarahchen',
  avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
  title: 'CEO & Co-founder',
  company: 'Stripe',
  batch: 'W20',
  bio: `I'm passionate about building products that make financial infrastructure accessible to everyone. Before founding my current company, I spent 5 years at Google working on payments infrastructure.

My interests include distributed systems, fintech innovation, and mentoring early-stage founders. I'm always happy to chat about fundraising, product-market fit, or technical architecture decisions.

Outside of work, I enjoy hiking, reading science fiction, and playing chess. Feel free to reach out if you'd like to connect!`,
};

const mockExperience = [
  { id: '1', role: 'CEO & Co-founder', companyName: 'Stripe', companyLogoUrl: 'https://logo.clearbit.com/stripe.com', startDate: 'Jan 2020', endDate: 'Present', duration: '4 yrs', location: 'San Francisco, CA', description: 'Leading a team of 50+ engineers building the future of financial infrastructure. Raised $100M Series B at $2B valuation.' },
  { id: '2', role: 'Senior Software Engineer', companyName: 'Google', companyLogoUrl: 'https://logo.clearbit.com/google.com', startDate: 'Mar 2015', endDate: 'Dec 2019', duration: '4 yrs 10 mos', location: 'Mountain View, CA', description: 'Tech lead for Google Pay backend services. Scaled payment processing to handle 10M+ daily transactions.' },
  { id: '3', role: 'Software Engineer', companyName: 'Meta', companyLogoUrl: 'https://logo.clearbit.com/meta.com', startDate: 'Jun 2012', endDate: 'Feb 2015', duration: '2 yrs 9 mos', location: 'Menlo Park, CA', description: 'Built core infrastructure for Facebook Messenger payments feature.' },
];

const mockEducation = [
  { id: '1', degree: 'MBA', fieldOfStudy: 'Business Administration', schoolName: 'Stanford Graduate School of Business', schoolLogoUrl: 'https://logo.clearbit.com/stanford.edu', startYear: '2018', endYear: '2020' },
  { id: '2', degree: 'BS', fieldOfStudy: 'Computer Science', schoolName: 'MIT', schoolLogoUrl: 'https://logo.clearbit.com/mit.edu', startYear: '2008', endYear: '2012' },
];

const mockNews = [
  { id: '1', title: 'Stripe raises $100M Series B led by Sequoia Capital', url: 'https://techcrunch.com', thumbnailUrl: 'https://picsum.photos/400/200?random=1', source: 'TechCrunch', publishedAt: '2024-01-15' },
  { id: '2', title: 'The Future of Payments: Interview with Sarah Chen', url: 'https://forbes.com', thumbnailUrl: 'https://picsum.photos/400/200?random=2', source: 'Forbes', publishedAt: '2024-01-10' },
  { id: '3', title: 'YC W20 Companies: Where Are They Now?', url: 'https://ycombinator.com', thumbnailUrl: 'https://picsum.photos/400/200?random=3', source: 'Y Combinator', publishedAt: '2024-01-05' },
];

const mockPhotos = [
  { id: '1', url: 'https://picsum.photos/400/300?random=10', alt: 'Team photo', caption: 'Team offsite 2024' },
  { id: '2', url: 'https://picsum.photos/400/300?random=11', alt: 'Conference', caption: 'Speaking at TechCrunch Disrupt' },
  { id: '3', url: 'https://picsum.photos/400/300?random=12', alt: 'Office', caption: 'New office in SF' },
  { id: '4', url: 'https://picsum.photos/400/300?random=13', alt: 'Award', caption: 'Forbes 30 Under 30' },
  { id: '5', url: 'https://picsum.photos/400/300?random=14', alt: 'Hiking', caption: 'Weekend hiking trip' },
  { id: '6', url: 'https://picsum.photos/400/300?random=15', alt: 'Demo day', caption: 'YC Demo Day' },
];

const tabs = [
  { id: 'bio', label: 'Bio' },
  { id: 'experience', label: 'Experience', count: mockExperience.length },
  { id: 'education', label: 'Education', count: mockEducation.length },
  { id: 'news', label: 'News', count: mockNews.length },
  { id: 'photos', label: 'Photos', count: mockPhotos.length },
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
    marginBottom: '16px',
    margin: 0,
    paddingBottom: '12px',
    borderBottom: '1px solid #e0e0e0',
  },
  bioText: {
    fontSize: '14px',
    color: '#2F2C26',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap' as const,
  },
  sidebar: {
    position: 'sticky' as const,
    top: '88px',
    height: 'fit-content',
  },
};

export const UserProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bio');
  const [isFollowing, setIsFollowing] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'bio':
        return (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>About</h2>
            <p style={styles.bioText}>{mockUser.bio}</p>
          </div>
        );
      case 'experience':
        return (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Experience</h2>
            {mockExperience.map((exp) => (
              <ExperienceItem
                key={exp.id}
                {...exp}
                onCompanyClick={() => console.log('View company', exp.companyName)}
              />
            ))}
          </div>
        );
      case 'education':
        return (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Education</h2>
            {mockEducation.map((edu) => (
              <EducationItem
                key={edu.id}
                {...edu}
                onSchoolClick={() => console.log('View school', edu.schoolName)}
              />
            ))}
          </div>
        );
      case 'news':
        return (
          <div style={styles.section}>
            <NewsSection articles={mockNews} />
          </div>
        );
      case 'photos':
        return (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Photos</h2>
            <PhotosGallery photos={mockPhotos} />
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
        type="user"
        name={mockUser.name}
        username={mockUser.username}
        avatarUrl={mockUser.avatarUrl}
        title={mockUser.title}
        company={mockUser.company}
        batch={mockUser.batch}
        isFollowing={isFollowing}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onFollowClick={() => setIsFollowing(!isFollowing)}
        onMessageClick={() => console.log('Message user')}
        onCompanyClick={() => console.log('View company')}
      />
      
      <div style={styles.container}>
        <main style={styles.main}>
          {renderContent()}
        </main>
        
        <aside style={styles.sidebar}>
          <ProfileSidebar
            type="user"
            founded="Stripe (company)"
            batches={['W20']}
            locations={['San Francisco, CA']}
            socialLinks={{
              linkedin: 'https://linkedin.com/in/sarahchen',
              twitter: 'https://twitter.com/sarahchen',
              github: 'https://github.com/sarahchen',
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
