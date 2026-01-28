import React, { useState } from 'react';
import { BookfaceHeader } from '../BookfaceHeader';
import { KnowledgeBaseSidebar } from '../KnowledgeBaseSidebar';
import type { KnowledgeBaseSection } from '../KnowledgeBaseSidebar';
import { ArticleContent } from '../ArticleContent';

const mockSections: KnowledgeBaseSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    children: [
      { id: 'welcome', title: 'Welcome to the Community' },
      { id: 'profile-setup', title: 'Setting Up Your Profile' },
      { id: 'finding-people', title: 'Finding People & Companies' },
      { id: 'posting-guidelines', title: 'Community Guidelines' },
    ],
  },
  {
    id: 'fundraising',
    title: 'Fundraising',
    children: [
      { id: 'when-to-raise', title: 'When to Raise' },
      { id: 'preparing-deck', title: 'Preparing Your Deck' },
      { id: 'finding-investors', title: 'Finding Investors' },
      { id: 'term-sheets', title: 'Understanding Term Sheets' },
      { id: 'closing-round', title: 'Closing Your Round' },
    ],
  },
  {
    id: 'hiring',
    title: 'Hiring',
    children: [
      { id: 'hiring-first', title: 'Making Your First Hire' },
      { id: 'compensation', title: 'Compensation & Equity' },
      { id: 'interviewing', title: 'Interviewing Best Practices' },
      { id: 'culture', title: 'Building Company Culture' },
    ],
  },
  {
    id: 'product',
    title: 'Product',
    children: [
      { id: 'pmf', title: 'Finding Product-Market Fit' },
      { id: 'user-research', title: 'User Research' },
      { id: 'metrics', title: 'Key Metrics to Track' },
      { id: 'roadmapping', title: 'Product Roadmapping' },
    ],
  },
  {
    id: 'legal',
    title: 'Legal',
    children: [
      { id: 'incorporation', title: 'Incorporating Your Company' },
      { id: 'equity-structure', title: 'Equity Structure' },
      { id: 'ip-protection', title: 'IP Protection' },
      { id: 'contracts', title: 'Standard Contracts' },
    ],
  },
];

const mockArticles: Record<string, { title: string; content: string; updatedAt: string }> = {
  'welcome': {
    title: 'Welcome to the Community',
    updatedAt: 'Last updated: January 15, 2024',
    content: `
      <p>Welcome to our founder community! This platform is designed to help you connect with other founders, share knowledge, and accelerate your startup journey.</p>
      
      <h2>What You Can Do Here</h2>
      <ul>
        <li><strong>Connect with founders</strong> - Find people in your batch, industry, or location</li>
        <li><strong>Share updates</strong> - Post about your wins, challenges, and learnings</li>
        <li><strong>Get advice</strong> - Ask questions and learn from those who've been there</li>
        <li><strong>Find resources</strong> - Access our knowledge base and library of content</li>
        <li><strong>Book office hours</strong> - Get 1:1 time with partners and experts</li>
      </ul>
      
      <h2>Community Guidelines</h2>
      <p>To maintain a helpful and supportive environment, please follow these guidelines:</p>
      <ol>
        <li>Be respectful and constructive in all interactions</li>
        <li>Keep sensitive information confidential</li>
        <li>Give back by answering questions when you can</li>
        <li>Report any spam or inappropriate content</li>
      </ol>
      
      <h2>Need Help?</h2>
      <p>If you have questions about using the platform, reach out to <a href="mailto:support@outsome.com">support@outsome.com</a> or post in the #help channel.</p>
    `,
  },
  'when-to-raise': {
    title: 'When to Raise',
    updatedAt: 'Last updated: January 10, 2024',
    content: `
      <p>Deciding when to raise funding is one of the most important decisions you'll make as a founder. Here's how to think about timing.</p>
      
      <h2>Signs You're Ready to Raise</h2>
      <ul>
        <li><strong>Product-market fit signals</strong> - Users are engaged, retention is strong, and you're seeing organic growth</li>
        <li><strong>Clear use of funds</strong> - You know exactly what you'll do with the money and how it will accelerate growth</li>
        <li><strong>Strong team</strong> - You have the right people to execute on your plan</li>
        <li><strong>Market timing</strong> - The market conditions are favorable for your space</li>
      </ul>
      
      <h2>When NOT to Raise</h2>
      <p>Avoid raising if:</p>
      <ul>
        <li>You're raising because you think you should, not because you need to</li>
        <li>You don't have a clear plan for the money</li>
        <li>Your metrics aren't showing clear traction</li>
        <li>You're not ready to commit to a VC-backed path</li>
      </ul>
      
      <h2>The Fundraising Timeline</h2>
      <p>A typical fundraise takes 3-6 months. Here's a rough timeline:</p>
      <ol>
        <li><strong>Month 1-2:</strong> Preparation - deck, data room, target list</li>
        <li><strong>Month 2-3:</strong> Initial meetings and building momentum</li>
        <li><strong>Month 3-4:</strong> Partner meetings and term sheet negotiations</li>
        <li><strong>Month 4-6:</strong> Due diligence and closing</li>
      </ol>
      
      <p>Start preparing at least 2 months before you want to actively fundraise.</p>
    `,
  },
  'pmf': {
    title: 'Finding Product-Market Fit',
    updatedAt: 'Last updated: January 8, 2024',
    content: `
      <p>Product-market fit is when you've built something that people want. It's the foundation of a successful startup.</p>
      
      <h2>Signs of Product-Market Fit</h2>
      <ul>
        <li><strong>Retention</strong> - Users come back repeatedly without being asked</li>
        <li><strong>Word of mouth</strong> - Users recommend your product to others</li>
        <li><strong>Pull vs. push</strong> - Users are pulling the product from you rather than you pushing it on them</li>
        <li><strong>Willingness to pay</strong> - Users will pay for your product (or engage deeply if free)</li>
      </ul>
      
      <h2>How to Find PMF</h2>
      <ol>
        <li><strong>Talk to users constantly</strong> - Do at least 5 user interviews per week</li>
        <li><strong>Measure what matters</strong> - Focus on retention, not vanity metrics</li>
        <li><strong>Iterate quickly</strong> - Ship new versions weekly</li>
        <li><strong>Find your superhuman users</strong> - Who loves your product and why?</li>
      </ol>
      
      <h2>The PMF Survey</h2>
      <p>Ask users: "How would you feel if you could no longer use [product]?"</p>
      <ul>
        <li>Very disappointed</li>
        <li>Somewhat disappointed</li>
        <li>Not disappointed</li>
      </ul>
      <p>If 40%+ say "very disappointed," you likely have PMF.</p>
      
      <h2>Common Mistakes</h2>
      <ul>
        <li>Building features instead of talking to users</li>
        <li>Focusing on growth before retention</li>
        <li>Declaring PMF too early</li>
        <li>Not being narrow enough on target customer</li>
      </ul>
    `,
  },
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#fefaf3',
    fontFamily: '"BDO Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  container: {
    display: 'flex',
    height: 'calc(100vh - 60px)',
  },
  sidebarContainer: {
    width: '280px',
    flexShrink: 0,
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e0e0e0',
  },
  contentContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '32px 48px',
    backgroundColor: '#ffffff',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#666666',
    fontSize: '14px',
  },
};

export const KnowledgeBasePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [activeArticle, setActiveArticle] = useState<string>('welcome');
  const [isBookmarked, setIsBookmarked] = useState(false);

  const currentArticle = activeArticle ? mockArticles[activeArticle] : null;

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const handleArticleClick = (sectionId: string, articleId: string) => {
    setActiveSection(sectionId);
    setActiveArticle(articleId);
    setIsBookmarked(false);
  };

  const handleSearch = (query: string) => {
    console.log('Search:', query);
  };

  return (
    <div style={styles.page}>
      <BookfaceHeader userName="John Doe" userAvatarUrl="https://i.pravatar.cc/150?u=johndoe" notificationCount={3} />
      
      <div style={styles.container}>
        <div style={styles.sidebarContainer}>
          <KnowledgeBaseSidebar
            sections={mockSections}
            activeSection={activeSection}
            activeArticle={activeArticle}
            onSectionClick={handleSectionClick}
            onArticleClick={handleArticleClick}
            onSearch={handleSearch}
          />
        </div>
        
        <div style={styles.contentContainer}>
          {currentArticle ? (
            <ArticleContent
              title={currentArticle.title}
              content={currentArticle.content}
              updatedAt={currentArticle.updatedAt}
              isBookmarked={isBookmarked}
              onBookmark={() => setIsBookmarked(!isBookmarked)}
              onLinkClick={(url) => console.log('Link clicked:', url)}
            />
          ) : (
            <div style={styles.emptyState}>
              Select an article from the sidebar to view its content
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
