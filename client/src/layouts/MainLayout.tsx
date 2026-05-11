import React from 'react';
import Navbar from '../components/Navbar';
import ChatSidebar from '../components/ChatSidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content-wrapper">
        <ChatSidebar />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
