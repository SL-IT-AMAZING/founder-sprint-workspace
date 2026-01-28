import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BookfaceFeedPage } from './BookfaceFeedPage';
import { PeopleDirectoryPage } from './pages/PeopleDirectoryPage';
import { CompaniesDirectoryPage } from './pages/CompaniesDirectoryPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { CompanyProfilePage } from './pages/CompanyProfilePage';
import { PostDetailPage } from './pages/PostDetailPage';
import { MessagesPage } from './pages/MessagesPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { LibraryPage } from './pages/LibraryPage';
import { OfficeHoursPage } from './pages/OfficeHoursPage';

export const BookfaceApp: React.FC = () => {
  return (
    <Routes>
      <Route index element={<BookfaceFeedPage />} />
      
      <Route path="people" element={<PeopleDirectoryPage />} />
      <Route path="people/:username" element={<UserProfilePage />} />
      
      <Route path="companies" element={<CompaniesDirectoryPage />} />
      <Route path="companies/:slug" element={<CompanyProfilePage />} />
      
      <Route path="post/:id" element={<PostDetailPage />} />
      
      <Route path="messages" element={<MessagesPage />} />
      <Route path="messages/:conversationId" element={<MessagesPage />} />
      
      <Route path="knowledge" element={<KnowledgeBasePage />} />
      <Route path="knowledge/:sectionId" element={<KnowledgeBasePage />} />
      <Route path="knowledge/:sectionId/:articleId" element={<KnowledgeBasePage />} />
      
      <Route path="library" element={<LibraryPage />} />
      <Route path="library/:videoId" element={<LibraryPage />} />
      
      <Route path="office-hours" element={<OfficeHoursPage />} />
      
      <Route path="*" element={<Navigate to="/community" replace />} />
    </Routes>
  );
};

export default BookfaceApp;
