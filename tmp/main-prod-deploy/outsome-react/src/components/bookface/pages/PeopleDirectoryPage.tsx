import React, { useState } from 'react';
import { BookfaceHeader } from '../BookfaceHeader';
import { LeftSidebar } from '../LeftSidebar';
import { DirectoryFilters } from '../DirectoryFilters';
import type { FilterSection } from '../DirectoryFilters';
import { PersonListItem } from '../PersonListItem';

const mockPeople = [
  { id: '1', name: 'Sarah Chen', avatarUrl: 'https://i.pravatar.cc/150?u=sarah', batch: 'W20', currentRole: 'CEO', currentCompany: 'Stripe', currentCompanyId: 'stripe', startDate: 'Jan 2020', location: 'San Francisco, CA', previousCompanies: [{ name: 'Google', id: 'google' }], linkedInUrl: 'https://linkedin.com' },
  { id: '2', name: 'Michael Rodriguez', avatarUrl: 'https://i.pravatar.cc/150?u=michael', batch: 'S19', currentRole: 'CTO', currentCompany: 'Notion', currentCompanyId: 'notion', startDate: 'Mar 2019', location: 'New York, NY', previousCompanies: [{ name: 'Facebook', id: 'facebook' }], linkedInUrl: 'https://linkedin.com' },
  { id: '3', name: 'Emily Watson', avatarUrl: 'https://i.pravatar.cc/150?u=emily', batch: 'W21', currentRole: 'Founder', currentCompany: 'Figma', currentCompanyId: 'figma', startDate: 'Jun 2021', location: 'Los Angeles, CA', previousCompanies: [], linkedInUrl: 'https://linkedin.com' },
  { id: '4', name: 'Alex Kim', avatarUrl: 'https://i.pravatar.cc/150?u=alex', batch: 'W22', currentRole: 'Co-founder', currentCompany: 'Linear', currentCompanyId: 'linear', startDate: 'Sep 2022', location: 'San Francisco, CA', previousCompanies: [{ name: 'Uber', id: 'uber' }], linkedInUrl: 'https://linkedin.com' },
  { id: '5', name: 'Jessica Liu', avatarUrl: 'https://i.pravatar.cc/150?u=jessica', batch: 'S21', currentRole: 'Engineering Lead', currentCompany: 'Vercel', currentCompanyId: 'vercel', startDate: 'Feb 2021', location: 'Seattle, WA', previousCompanies: [{ name: 'Amazon', id: 'amazon' }], linkedInUrl: 'https://linkedin.com' },
  { id: '6', name: 'David Park', avatarUrl: 'https://i.pravatar.cc/150?u=david', batch: 'W19', currentRole: 'Product Manager', currentCompany: 'Airbnb', currentCompanyId: 'airbnb', startDate: 'Apr 2019', location: 'Austin, TX', previousCompanies: [{ name: 'Twitter', id: 'twitter' }], linkedInUrl: 'https://linkedin.com' },
  { id: '7', name: 'Rachel Green', avatarUrl: 'https://i.pravatar.cc/150?u=rachel', batch: 'S20', currentRole: 'Designer', currentCompany: 'Coinbase', currentCompanyId: 'coinbase', startDate: 'Aug 2020', location: 'Denver, CO', previousCompanies: [], linkedInUrl: 'https://linkedin.com' },
  { id: '8', name: 'James Wilson', avatarUrl: 'https://i.pravatar.cc/150?u=james', batch: 'W23', currentRole: 'CEO', currentCompany: 'Retool', currentCompanyId: 'retool', startDate: 'Jan 2023', location: 'Boston, MA', previousCompanies: [{ name: 'Dropbox', id: 'dropbox' }], linkedInUrl: 'https://linkedin.com' },
  { id: '9', name: 'Maria Garcia', avatarUrl: 'https://i.pravatar.cc/150?u=maria', batch: 'S22', currentRole: 'VP Engineering', currentCompany: 'Plaid', currentCompanyId: 'plaid', startDate: 'May 2022', location: 'Chicago, IL', previousCompanies: [{ name: 'Stripe', id: 'stripe' }], linkedInUrl: 'https://linkedin.com' },
  { id: '10', name: 'Kevin Lee', avatarUrl: 'https://i.pravatar.cc/150?u=kevin', batch: 'W24', currentRole: 'Founder', currentCompany: 'Ramp', currentCompanyId: 'ramp', startDate: 'Feb 2024', location: 'San Francisco, CA', previousCompanies: [], linkedInUrl: 'https://linkedin.com' },
  { id: '11', name: 'Amanda Johnson', avatarUrl: 'https://i.pravatar.cc/150?u=amanda', batch: 'S23', currentRole: 'Head of Product', currentCompany: 'Brex', currentCompanyId: 'brex', startDate: 'Jul 2023', location: 'Miami, FL', previousCompanies: [{ name: 'Square', id: 'square' }], linkedInUrl: 'https://linkedin.com' },
  { id: '12', name: 'Chris Taylor', avatarUrl: 'https://i.pravatar.cc/150?u=chris', batch: 'W21', currentRole: 'CTO', currentCompany: 'Scale AI', currentCompanyId: 'scale', startDate: 'Nov 2021', location: 'Palo Alto, CA', previousCompanies: [{ name: 'OpenAI', id: 'openai' }], linkedInUrl: 'https://linkedin.com' },
  { id: '13', name: 'Sophie Brown', avatarUrl: 'https://i.pravatar.cc/150?u=sophie', batch: 'S24', currentRole: 'Founder', currentCompany: 'Anthropic', currentCompanyId: 'anthropic', startDate: 'Mar 2024', location: 'San Francisco, CA', previousCompanies: [{ name: 'DeepMind', id: 'deepmind' }], linkedInUrl: 'https://linkedin.com' },
  { id: '14', name: 'Daniel Martinez', avatarUrl: 'https://i.pravatar.cc/150?u=daniel', batch: 'W20', currentRole: 'Engineering Manager', currentCompany: 'Databricks', currentCompanyId: 'databricks', startDate: 'Oct 2020', location: 'Portland, OR', previousCompanies: [], linkedInUrl: 'https://linkedin.com' },
  { id: '15', name: 'Lisa Wang', avatarUrl: 'https://i.pravatar.cc/150?u=lisa', batch: 'S21', currentRole: 'Co-founder', currentCompany: 'Runway', currentCompanyId: 'runway', startDate: 'Jun 2021', location: 'New York, NY', previousCompanies: [{ name: 'Adobe', id: 'adobe' }], linkedInUrl: 'https://linkedin.com' },
];

const filterSections: FilterSection[] = [
  { id: 'batch', label: 'Batch', type: 'checkbox', options: [
    { value: 'W24', label: 'W24', count: 156 },
    { value: 'S24', label: 'S24', count: 142 },
    { value: 'W23', label: 'W23', count: 178 },
    { value: 'S23', label: 'S23', count: 165 },
    { value: 'W22', label: 'W22', count: 189 },
    { value: 'S22', label: 'S22', count: 171 },
    { value: 'W21', label: 'W21', count: 201 },
    { value: 'S21', label: 'S21', count: 194 },
  ]},
  { id: 'location', label: 'Location', type: 'search-checkbox', options: [
    { value: 'sf', label: 'San Francisco, CA', count: 892 },
    { value: 'nyc', label: 'New York, NY', count: 567 },
    { value: 'la', label: 'Los Angeles, CA', count: 234 },
    { value: 'seattle', label: 'Seattle, WA', count: 198 },
    { value: 'austin', label: 'Austin, TX', count: 145 },
    { value: 'boston', label: 'Boston, MA', count: 123 },
  ]},
  { id: 'industry', label: 'Industry', type: 'checkbox', options: [
    { value: 'saas', label: 'SaaS', count: 456 },
    { value: 'fintech', label: 'Fintech', count: 312 },
    { value: 'ai', label: 'AI/ML', count: 289 },
    { value: 'healthcare', label: 'Healthcare', count: 178 },
    { value: 'ecommerce', label: 'E-commerce', count: 156 },
  ]},
  { id: 'role', label: 'Role', type: 'checkbox', options: [
    { value: 'founder', label: 'Founder/CEO', count: 678 },
    { value: 'cto', label: 'CTO', count: 234 },
    { value: 'engineering', label: 'Engineering', count: 567 },
    { value: 'product', label: 'Product', count: 345 },
    { value: 'design', label: 'Design', count: 189 },
  ]},
];

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#fefaf3',
    fontFamily: '"BDO Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  container: {
    display: 'flex',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
    gap: '24px',
  },
  sidebar: {
    width: '200px',
    flexShrink: 0,
  },
  filters: {
    width: '240px',
    flexShrink: 0,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#2F2C26',
    margin: 0,
  },
  count: {
    fontSize: '14px',
    color: '#666666',
  },
  searchContainer: {
    marginBottom: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box' as const,
  },
  listContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
  },
};

export const PeopleDirectoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  const handleFilterChange = (sectionId: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [sectionId]: value }));
  };

  const handleClearFilters = () => {
    setFilterValues({});
  };

  const filteredPeople = mockPeople.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.currentCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.currentRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <BookfaceHeader userName="John Doe" userAvatarUrl="https://i.pravatar.cc/150?u=johndoe" notificationCount={3} />
      
      <div style={styles.container}>
        <div style={styles.sidebar}>
          <LeftSidebar activeItem="people" />
        </div>
        
        <DirectoryFilters
          sections={filterSections}
          values={filterValues}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
        
        <main style={styles.main}>
          <div style={styles.header}>
            <h1 style={styles.title}>People</h1>
            <span style={styles.count}>Showing {filteredPeople.length.toLocaleString()} people</span>
          </div>
          
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search people by name, company, or role..."
              style={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div style={styles.listContainer}>
            {filteredPeople.map((person) => (
              <PersonListItem
                key={person.id}
                {...person}
                onProfileClick={() => console.log('View profile', person.id)}
                onCompanyClick={(companyId) => console.log('View company', companyId)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};
