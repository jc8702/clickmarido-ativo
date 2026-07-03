'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  links: NavLink[];
  logo?: React.ReactNode;
  user?: { name: string; email: string };
  onLogout?: () => void;
}

export function Sidebar({
  isOpen,
  onToggle,
  links,
  logo,
  user,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname() ?? '/';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load sidebar state from localStorage
    const saved = localStorage.getItem('sidebarOpen');
    if (saved === 'false') {
      onToggle();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', String(isOpen));
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 md:w-auto
          transition-all duration-300
          bg-white dark:bg-neutral-900
          border-r border-neutral-200 dark:border-neutral-700
          flex flex-col print:hidden
          ${isOpen ? 'md:w-64' : 'md:w-20'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className={`flex items-center px-4 py-6 border-b border-neutral-200 dark:border-neutral-700 ${isOpen ? 'justify-between' : 'justify-center relative'}`}>
          {isOpen ? (
            <div className="flex items-center gap-3">
              <img
                src="/api/favicon"
                alt="Click Marido Logo"
                className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                onError={(e) => { e.currentTarget.src = '/logo.jpg' }}
              />
              <span className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                Click Marido
              </span>
            </div>
          ) : (
            <img
              src="/api/favicon"
              alt="Click Marido Logo"
              onClick={onToggle}
              className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:opacity-80 transition-opacity"
              title="Abrir menu"
              onError={(e) => { e.currentTarget.src = '/logo.jpg' }}
            />
          )}

          {isOpen ? (
            <button
              onClick={onToggle}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              title="Fechar menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          ) : (
            <button
              onClick={onToggle}
              className="absolute -right-3 top-1/2 -translate-y-1/2 bg-neutral-900 dark:bg-neutral-850 dark:bg-neutral-800 text-white rounded-full p-1 border border-neutral-200 dark:border-neutral-700 shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors z-50 flex items-center justify-center"
              title="Abrir menu"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                scroll={false}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 768) {
                    onToggle();
                  }
                }}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg
                  transition-all duration-200 select-none whitespace-nowrap
                  ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }
                `}
                title={!isOpen ? link.label : undefined}
              >
                <span className="flex-shrink-0 w-5 h-5">{link.icon}</span>
                {isOpen && <span className="text-sm font-medium">{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer: User Info */}
        {user && (
          <div className="border-t border-neutral-200 dark:border-neutral-700 px-3 py-4 space-y-3">
            {isOpen ? (
              <>
                <div className="flex items-center justify-between px-2 py-1 gap-2">
                  <div className="truncate flex-1">
                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {user.email}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <ThemeToggle />
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="w-full px-3 py-2 rounded-lg text-sm font-medium
                      border border-neutral-200 dark:border-neutral-700
                      text-neutral-600 dark:text-neutral-400
                      hover:bg-neutral-50 dark:hover:bg-neutral-800
                      transition-colors"
                  >
                    Sair
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ThemeToggle />
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="w-full p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800
                      transition-colors text-neutral-600 dark:text-neutral-400 flex justify-center"
                    title="Sair"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
