'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  itemCode: string;
  companyName?: string;
  jobTitle?: string;
  linkedInterviewsCount?: number;
  description?: string;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemCode,
  companyName,
  jobTitle,
  linkedInterviewsCount = 0,
  description,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0e0f0c]/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#d8dcd5] shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#320707]/10 border border-[#d03238]/20 flex items-center justify-center flex-shrink-0 text-[#d03238]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-wise-display text-base font-black text-[#0e0f0c] flex items-center gap-2">
                <span>{title}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#e8ebe6] text-[#0e0f0c] font-bold border border-[#d8dcd5]">
                  {itemCode}
                </span>
              </h3>

              <div className="mt-2 text-xs text-[#454745] space-y-1 leading-relaxed">
                {companyName && (
                  <p>
                    Target Record: <strong className="text-[#0e0f0c] font-bold">{companyName}</strong>
                    {jobTitle && <span> — {jobTitle}</span>}
                  </p>
                )}
                {description && <p>{description}</p>}
              </div>

              {linkedInterviewsCount > 0 && (
                <div className="mt-3.5 p-3.5 rounded-2xl bg-[#320707]/10 border border-[#d03238]/30 text-[#d03238] text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-[#a7000d]">
                    <AlertTriangle className="w-4 h-4 text-[#d03238]" />
                    Cascading Delete Warning
                  </div>
                  <p className="text-[11px] text-[#454745] font-medium leading-normal">
                    This will permanently delete {linkedInterviewsCount} linked interview round{linkedInterviewsCount > 1 ? 's' : ''} from the database. This action cannot be undone.
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-[#868685] hover:text-[#0e0f0c] p-1 rounded-full hover:bg-[#e8ebe6] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-bold text-[#454745] bg-[#e8ebe6] hover:bg-[#d8dcd5] hover:text-[#0e0f0c] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#d03238] hover:bg-[#a72027] transition-all shadow-md disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Deleting…</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 text-white" />
                  <span>Delete Record</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
