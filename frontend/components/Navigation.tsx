'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export interface NavigationProps {
  links: NavLink[];
  logo?: React.ReactNode;
  user?: { name: string; email: string };
  onLogout?: () => void;
  onMenuClick?: () => void;
}

export function Navigation({ links, logo, user, onLogout, onMenuClick }: NavigationProps) {
  const pathname = usePathname() ?? '/';

  return (
    <nav className="bg-gradient-dark text-white sticky top-0 z-[1030] shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="md:hidden text-white hover:opacity-80"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            {logo}
          </div>

          <div className="hidden md:flex gap-4">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md
                    transition-all duration-300
                    ${isActive ? 'bg-white/20 shadow-sm' : 'hover:bg-white/10'}
                  `}
                >
                  {link.icon && <span>{link.icon}</span>}
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-right">
                <div className="font-semibold">{user.name}</div>
                <div className="opacity-75 text-xs">{user.email}</div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-4 py-2 rounded-md bg-white/20 hover:bg-white/30 transition-colors text-sm"
                >
                  Sair
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
