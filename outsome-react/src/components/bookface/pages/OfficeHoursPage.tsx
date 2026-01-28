import React from 'react';
import { BookfaceHeader } from '../BookfaceHeader';
import { LeftSidebar } from '../LeftSidebar';
import { OfficeHoursForm } from '../OfficeHoursForm';

const mockPartners = [
  { id: '1', name: 'Michael Seibel' },
  { id: '2', name: 'Dalton Caldwell' },
  { id: '3', name: 'Gustaf Alstromer' },
  { id: '4', name: 'Adora Cheung' },
  { id: '5', name: 'Aaron Epstein' },
  { id: '6', name: 'Kevin Hale' },
  { id: '7', name: 'Harj Taggar' },
];

const mockExperts = [
  { id: 'e1', name: 'Michael Seibel', avatarUrl: 'https://i.pravatar.cc/150?u=mseibel', specialty: 'Product & Strategy', available: true },
  { id: 'e2', name: 'Dalton Caldwell', avatarUrl: 'https://i.pravatar.cc/150?u=dalton', specialty: 'B2B Sales & Enterprise', available: true },
  { id: 'e3', name: 'Gustaf Alstromer', avatarUrl: 'https://i.pravatar.cc/150?u=gustaf', specialty: 'Growth & Marketing', available: false },
  { id: 'e4', name: 'Adora Cheung', avatarUrl: 'https://i.pravatar.cc/150?u=adora', specialty: 'Operations & Marketplace', available: true },
  { id: 'e5', name: 'Kevin Hale', avatarUrl: 'https://i.pravatar.cc/150?u=kevin', specialty: 'Product Design & UX', available: true },
];

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#fefaf3',
    fontFamily: '"BDO Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    display: 'grid',
    gridTemplateColumns: '200px 1fr 300px',
    gap: '24px',
  },
  main: {
    minWidth: 0,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    padding: '24px',
  },
  pageHeader: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#2F2C26',
    margin: 0,
    marginBottom: '8px',
  },
  description: {
    fontSize: '14px',
    color: '#666666',
    lineHeight: 1.6,
    margin: 0,
  },
  expertsCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
  },
  expertsHeader: {
    padding: '16px',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#2F2C26',
  },
  expertItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    gap: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  expertAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    flexShrink: 0,
  },
  expertInfo: {
    flex: 1,
    minWidth: 0,
  },
  expertName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2F2C26',
    marginBottom: '2px',
  },
  expertSpecialty: {
    fontSize: '12px',
    color: '#666666',
  },
  availabilityBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: 500,
    flexShrink: 0,
  },
  availableBadge: {
    backgroundColor: '#e6f4ea',
    color: '#1e7e34',
  },
  unavailableBadge: {
    backgroundColor: '#f0f0f0',
    color: '#666666',
  },
};

export const OfficeHoursPage: React.FC = () => {
  const handleSubmit = (data: {
    partnerId: string;
    topic: string;
    availability: string;
    shareWithCofounders: boolean;
  }) => {
    console.log('Office hours request submitted:', data);
    alert('Your office hours request has been submitted!');
  };

  return (
    <div style={styles.page}>
      <BookfaceHeader userName="John Doe" userAvatarUrl="https://i.pravatar.cc/150?u=johndoe" notificationCount={3} />
      
      <div style={styles.container}>
        <LeftSidebar activeItem="home" />
        
        <main style={styles.main}>
          <div style={styles.pageHeader}>
            <h1 style={styles.title}>Office Hours</h1>
            <p style={styles.description}>
              Book 1:1 time with partners and experts. Office hours are 20-minute sessions to discuss 
              specific challenges, get feedback on your approach, or ask questions about fundraising, 
              product, growth, and more.
            </p>
          </div>
          
          <div style={styles.card}>
            <OfficeHoursForm
              partners={mockPartners}
              onSubmit={handleSubmit}
              instructions="Please be specific about what you want to discuss to help us match you with the right partner."
            />
          </div>
        </main>
        
        <aside>
          <div style={styles.expertsCard}>
            <div style={styles.expertsHeader}>Available Experts</div>
            {mockExperts.map((expert) => (
              <div key={expert.id} style={styles.expertItem}>
                <img src={expert.avatarUrl} alt={expert.name} style={styles.expertAvatar} />
                <div style={styles.expertInfo}>
                  <div style={styles.expertName}>{expert.name}</div>
                  <div style={styles.expertSpecialty}>{expert.specialty}</div>
                </div>
                <span style={{
                  ...styles.availabilityBadge,
                  ...(expert.available ? styles.availableBadge : styles.unavailableBadge),
                }}>
                  {expert.available ? 'Available' : 'Busy'}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};
