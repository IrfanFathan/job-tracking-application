'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Check, ChevronDown, Building2, Briefcase, AlertCircle } from 'lucide-react';

export interface ApplicationOption {
  id: number;
  app_code: string;
  company_name: string;
  job_title: string;
  status: string;
}

interface SearchableAppSelectProps {
  applications: ApplicationOption[];
  value: number | null;
  onChange: (appId: number) => void;
  error?: string;
  disabled?: boolean;
}

export const SearchableAppSelect: React.FC<SearchableAppSelectProps> = ({
  applications,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedApp = applications.find((app) => app.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredApps = applications.filter((app) => {
    const query = searchTerm.toLowerCase();
    return (
      app.app_code.toLowerCase().includes(query) ||
      app.company_name.toLowerCase().includes(query) ||
      app.job_title.toLowerCase().includes(query)
    );
  });

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-xs font-semibold text-[#0e0f0c] mb-1">
        Target Application <span className="text-rose-600">*</span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left bg-[#ffffff] border text-xs text-[#0e0f0c] transition-colors ${
          error ? 'border-rose-500' : 'border-[#d0d6cc] hover:border-[#0e0f0c] focus:border-[#0e0f0c]'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {selectedApp ? (
          <div className="flex items-center space-x-2 truncate">
            <span className="px-2 py-0.5 rounded-full font-mono-wise text-[11px] font-semibold bg-[#e2f6d5] text-[#163300]">
              {selectedApp.app_code}
            </span>
            <span className="font-semibold text-[#0e0f0c] truncate">{selectedApp.company_name}</span>
            <span className="text-[#454745] text-xs truncate">— {selectedApp.job_title}</span>
          </div>
        ) : (
          <span className="text-[#868685]">Search and select an application…</span>
        )}
        <ChevronDown className="w-4 h-4 text-[#868685] flex-shrink-0 ml-2" />
      </button>

      {/* Live Auto-fill Join Preview Box */}
      {selectedApp && (
        <div className="mt-2 p-3 rounded-xl bg-[#e2f6d5] border border-[#c5edab] text-xs flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 text-[#163300]">
              <Building2 className="w-3.5 h-3.5" />
              <span className="font-semibold">{selectedApp.company_name}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[#163300]">
              <Briefcase className="w-3.5 h-3.5" />
              <span className="font-semibold">{selectedApp.job_title}</span>
            </div>
          </div>
          <span className="font-mono-wise text-[10px] uppercase font-bold text-[#163300] bg-[#ffffff] px-2 py-0.5 rounded-full shadow-xs">
            JOIN Live Sync
          </span>
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-semibold">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl bg-[#ffffff] border border-[#d0d6cc] shadow-2xl overflow-hidden">
          {/* Search Header */}
          <div className="p-2.5 border-b border-[#e8ebe6] bg-[#f4f6f3]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#868685] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type company, role, or APP code..."
                className="w-full bg-[#ffffff] text-[#0e0f0c] text-xs pl-9 pr-3 py-2 rounded-xl border border-[#d0d6cc] focus:outline-none focus:border-[#0e0f0c] placeholder-[#868685]"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-[#e8ebe6]">
            {filteredApps.length > 0 ? (
              filteredApps.map((app) => {
                const isSelected = app.id === value;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      onChange(app.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors hover:bg-[#e8ebe6] ${
                      isSelected ? 'bg-[#e2f6d5] text-[#163300]' : 'text-[#0e0f0c]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="font-mono-wise text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#ffffff] text-[#0e0f0c] border border-[#d0d6cc]">
                        {app.app_code}
                      </span>
                      <div className="truncate">
                        <span className="font-semibold text-xs block text-[#0e0f0c] truncate">
                          {app.company_name}
                        </span>
                        <span className="text-[11px] text-[#454745] block truncate">
                          {app.job_title}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#163300] flex-shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-[#868685]">
                No matching applications found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
