"use client";

import { useDashboardState } from "../hooks/use-dashboard-state";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { MainContent } from "./main-content";

interface DashboardShellProps {
  readonly userEmail: string;
}

export function DashboardShell({ userEmail }: DashboardShellProps) {
  const {
    selectedCategory,
    searchQuery,
    isMobileMenuOpen,
    isMobile,
    pageTitle,
    filteredSkills,
    setSelectedCategory,
    setSearchQuery,
    toggleMobileMenu,
    closeMobileMenu,
  } = useDashboardState();

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={closeMobileMenu}
          data-testid="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <AppSidebar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Right content area */}
      <div className="flex flex-1 flex-col md:ml-64">
        <AppHeader
          pageTitle={pageTitle}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isMobile={isMobile}
          onToggleMobileMenu={toggleMobileMenu}
          userEmail={userEmail}
        />
        <MainContent
          filteredSkills={filteredSkills}
          selectedCategory={selectedCategory}
          isLoading={false}
        />
      </div>
    </div>
  );
}
