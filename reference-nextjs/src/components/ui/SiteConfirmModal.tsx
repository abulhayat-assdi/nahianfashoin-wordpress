"use client";

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface SiteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SiteConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: SiteConfirmModalProps) {
  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isDanger ? "bg-red-50 text-red-500" : "bg-yellow-50 text-yellow-600"
              }`}
            >
              {isDanger ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
            </div>
            <button
              onClick={onCancel}
              className="text-[#999] hover:text-[#555] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <h3 className="text-[20px] font-bold text-[#222] mb-2">{title}</h3>
          <p className="text-[#666] text-[15px] leading-relaxed mb-8">{message}</p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-[#ddd] text-[#555] font-bold text-[14px] uppercase tracking-wider hover:bg-[#f5f5f5] transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-[14px] uppercase tracking-wider transition-all shadow-lg ${
                isDanger
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                  : "bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
