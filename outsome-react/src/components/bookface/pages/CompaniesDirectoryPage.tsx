import React, { useState } from 'react';
import { BookfaceHeader } from '../BookfaceHeader';
import { LeftSidebar } from '../LeftSidebar';
import { DirectoryFilters } from '../DirectoryFilters';
import type { FilterSection } from '../DirectoryFilters';
import { CompanyCard } from '../CompanyCard';

const mockCompanies = [
  { id: 'stripe', name: 'Stripe', description: 'Financial infrastructure for the internet. Millions of companies use Stripe to accept payments.', logoUrl: 'https://logo.clearbit.com/stripe.com', batch: 'W09', industryTags: ['FINTECH', 'PAYMENTS'], teamMembers: [{ name: 'Patrick Collison', avatarUrl: 'https://i.pravatar.cc/150?u=patrick' }, { name: 'John Collison', avatarUrl: 'https://i.pravatar.cc/150?u=john' }] },
  { id: 'airbnb', name: 'Airbnb', description: 'Book unique homes and experiences all over the world.', logoUrl: 'https://logo.clearbit.com/airbnb.com', batch: 'W09', industryTags: ['MARKETPLACE', 'TRAVEL'], teamMembers: [{ name: 'Brian Chesky', avatarUrl: 'https://i.pravatar.cc/150?u=brian' }] },
  { id: 'doordash', name: 'DoorDash', description: 'Food delivery and local logistics platform connecting customers with local businesses.', logoUrl: 'https://logo.clearbit.com/doordash.com', batch: 'S13', industryTags: ['LOGISTICS', 'FOOD'], teamMembers: [{ name: 'Tony Xu', avatarUrl: 'https://i.pravatar.cc/150?u=tony' }] },
  { id: 'coinbase', name: 'Coinbase', description: 'The easiest place to buy, sell, and manage your cryptocurrency portfolio.', logoUrl: 'https://logo.clearbit.com/coinbase.com', batch: 'S12', industryTags: ['CRYPTO', 'FINTECH'], teamMembers: [{ name: 'Brian Armstrong', avatarUrl: 'https://i.pravatar.cc/150?u=armstrong' }] },
  { id: 'instacart', name: 'Instacart', description: 'Grocery delivery and pick-up service in the United States and Canada.', logoUrl: 'https://logo.clearbit.com/instacart.com', batch: 'S12', industryTags: ['LOGISTICS', 'GROCERY'], teamMembers: [{ name: 'Apoorva Mehta', avatarUrl: 'https://i.pravatar.cc/150?u=apoorva' }] },
  { id: 'dropbox', name: 'Dropbox', description: 'Keep everything organized and access your files from anywhere.', logoUrl: 'https://logo.clearbit.com/dropbox.com', batch: 'S07', industryTags: ['SAAS', 'PRODUCTIVITY'], teamMembers: [{ name: 'Drew Houston', avatarUrl: 'https://i.pravatar.cc/150?u=drew' }] },
  { id: 'twitch', name: 'Twitch', description: 'Live streaming platform for gamers and creators.', logoUrl: 'https://logo.clearbit.com/twitch.tv', batch: 'W07', industryTags: ['MEDIA', 'GAMING'], teamMembers: [{ name: 'Emmett Shear', avatarUrl: 'https://i.pravatar.cc/150?u=emmett' }] },
  { id: 'reddit', name: 'Reddit', description: 'The front page of the internet. Home to thousands of communities.', logoUrl: 'https://logo.clearbit.com/reddit.com', batch: 'S05', industryTags: ['SOCIAL', 'MEDIA'], teamMembers: [{ name: 'Steve Huffman', avatarUrl: 'https://i.pravatar.cc/150?u=steve' }] },
  { id: 'openai', name: 'OpenAI', description: 'AI research and deployment company ensuring AI benefits all of humanity.', logoUrl: 'https://logo.clearbit.com/openai.com', batch: 'W16', industryTags: ['AI', 'RESEARCH'], teamMembers: [{ name: 'Sam Altman', avatarUrl: 'https://i.pravatar.cc/150?u=sam' }] },
  { id: 'retool', name: 'Retool', description: 'Build internal tools, remarkably fast.', logoUrl: 'https://logo.clearbit.com/retool.com', batch: 'W17', industryTags: ['SAAS', 'DEVELOPER TOOLS'], teamMembers: [{ name: 'David Hsu', avatarUrl: 'https://i.pravatar.cc/150?u=davidh' }] },
  { id: 'figma', name: 'Figma', description: 'The collaborative interface design tool.', logoUrl: 'https://logo.clearbit.com/figma.com', batch: 'W12', industryTags: ['SAAS', 'DESIGN'], teamMembers: [{ name: 'Dylan Field', avatarUrl: 'https://i.pravatar.cc/150?u=dylan' }] },
  { id: 'notion', name: 'Notion', description: 'All-in-one workspace for notes, docs, and project management.', logoUrl: 'https://logo.clearbit.com/notion.so', batch: 'S16', industryTags: ['SAAS', 'PRODUCTIVITY'], teamMembers: [{ name: 'Ivan Zhao', avatarUrl: 'https://i.pravatar.cc/150?u=ivan' }] },
  { id: 'linear', name: 'Linear', description: 'The issue tracking tool you will enjoy using.', logoUrl: 'https://logo.clearbit.com/linear.app', batch: 'W19', industryTags: ['SAAS', 'DEVELOPER TOOLS'], teamMembers: [{ name: 'Karri Saarinen', avatarUrl: 'https://i.pravatar.cc/150?u=karri' }] },
  { id: 'vercel', name: 'Vercel', description: 'Develop. Preview. Ship. The best frontend development experience.', logoUrl: 'https://logo.clearbit.com/vercel.com', batch: 'W18', industryTags: ['SAAS', 'DEVELOPER TOOLS'], teamMembers: [{ name: 'Guillermo Rauch', avatarUrl: 'https://i.pravatar.cc/150?u=guillermo' }] },
  { id: 'ramp', name: 'Ramp', description: 'The corporate card that helps you spend less.', logoUrl: 'https://logo.clearbit.com/ramp.com', batch: 'S19', industryTags: ['FINTECH', 'B2B'], teamMembers: [{ name: 'Eric Glyman', avatarUrl: 'https://i.pravatar.cc/150?u=eric' }] },
];

const filterSections: FilterSection[] = [
  { id: 'batch', label: 'Batch', type: 'checkbox', options: [
    { value: 'W24', label: 'W24', count: 89 },
    { value: 'S24', label: 'S24', count: 76 },
    { value: 'W23', label: 'W23', count: 92 },
    { value: 'S23', label: 'S23', count: 84 },
    { value: 'W22', label: 'W22', count: 97 },
    { value: 'S22', label: 'S22', count: 88 },
  ]},
  { id: 'industry', label: 'Industry', type: 'search-checkbox', options: [
    { value: 'saas', label: 'SaaS', count: 456 },
    { value: 'fintech', label: 'Fintech', count: 312 },
    { value: 'ai', label: 'AI/ML', count: 289 },
    { value: 'healthcare', label: 'Healthcare', count: 178 },
    { value: 'ecommerce', label: 'E-commerce', count: 156 },
    { value: 'devtools', label: 'Developer Tools', count: 134 },
    { value: 'marketplace', label: 'Marketplace', count: 112 },
  ]},
  { id: 'stage', label: 'Company Stage', type: 'checkbox', options: [
    { value: 'seed', label: 'Seed', count: 234 },
    { value: 'seriesA', label: 'Series A', count: 189 },
    { value: 'seriesB', label: 'Series B', count: 145 },
    { value: 'seriesC', label: 'Series C+', count: 98 },
    { value: 'public', label: 'Public', count: 23 },
  ]},
  { id: 'hiring', label: 'Hiring Status', type: 'checkbox', options: [
    { value: 'actively', label: 'Actively Hiring', count: 567 },
    { value: 'selectively', label: 'Selectively Hiring', count: 234 },
    { value: 'notHiring', label: 'Not Hiring', count: 89 },
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

export const CompaniesDirectoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  const handleFilterChange = (sectionId: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [sectionId]: value }));
  };

  const handleClearFilters = () => {
    setFilterValues({});
  };

  const filteredCompanies = mockCompanies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industryTags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={styles.page}>
      <BookfaceHeader userName="John Doe" userAvatarUrl="https://i.pravatar.cc/150?u=johndoe" notificationCount={3} />
      
      <div style={styles.container}>
        <div style={styles.sidebar}>
          <LeftSidebar activeItem="companies" />
        </div>
        
        <DirectoryFilters
          sections={filterSections}
          values={filterValues}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
        
        <main style={styles.main}>
          <div style={styles.header}>
            <h1 style={styles.title}>Companies</h1>
            <span style={styles.count}>Showing {filteredCompanies.length.toLocaleString()} companies</span>
          </div>
          
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search companies by name, industry, or description..."
              style={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div style={styles.listContainer}>
            {filteredCompanies.map((company) => (
              <CompanyCard
                key={company.id}
                {...company}
                onClick={() => console.log('View company', company.id)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};
