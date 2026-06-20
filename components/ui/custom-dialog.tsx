'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Info, Trash2, X } from 'lucide-react';
import { Button } from './button';

interface CustomDialogProps {
  show: boolean;
  type: 'alert' | 'confirm';
  variant?: 'success' | 'destructive' | 'warning' | 'info';
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function CustomDialog({
  show,
  type,
  variant = 'info',
  title,
  description,
  confirmText = 'ตกลง',
  cancelText = 'ยกเลิก',
  onConfirm,
  onCancel
}: CustomDialogProps) {
  if (!show) return null;

  // Variant styles and icons
  let icon = <Info className="size-8 text-amber-500" />;
  let accentColor = 'from-amber-400 to-amber-600';
  let iconBg = 'bg-amber-500/10 border-amber-500/20';

  if (variant === 'success') {
    icon = <CheckCircle2 className="size-8 text-emerald-500" />;
    accentColor = 'from-emerald-400 to-emerald-600';
    iconBg = 'bg-emerald-500/10 border-emerald-500/20';
  } else if (variant === 'destructive') {
    icon = <Trash2 className="size-8 text-rose-500" />;
    accentColor = 'from-rose-400 to-rose-600';
    iconBg = 'bg-rose-500/10 border-rose-500/20';
  } else if (variant === 'warning') {
    icon = <AlertTriangle className="size-8 text-amber-600" />;
    accentColor = 'from-amber-400 to-amber-600';
    iconBg = 'bg-amber-500/10 border-amber-500/20';
  }

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    } else if (type === 'alert') {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up relative">
        {/* Modal Ribbon Accent */}
        <div className={`h-1.5 bg-gradient-to-r ${accentColor}`} />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-amber-800/40 dark:text-amber-400/40 hover:bg-amber-500/10 hover:text-amber-800 dark:hover:text-amber-200 cursor-pointer transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Dialog Content */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* Icon Circle */}
          <div className={`w-16 h-16 rounded-full border flex items-center justify-center ${iconBg} mb-4`}>
            {icon}
          </div>

          {/* Title & Description */}
          <h3 className="font-bold text-lg text-amber-950 dark:text-amber-100 font-heading leading-tight">
            {title}
          </h3>
          <p className="text-xs text-amber-800/70 dark:text-amber-400/70 mt-2 px-2 leading-relaxed">
            {description}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2.5 w-full mt-6">
            {type === 'confirm' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 border-amber-200 hover:bg-amber-50/50 dark:border-amber-950/80 dark:hover:bg-amber-950/20 text-amber-900 dark:text-amber-300 text-xs font-bold py-5 cursor-pointer"
                >
                  {cancelText}
                </Button>
                <Button
                  type="button"
                  variant={variant === 'destructive' ? 'destructive' : 'default'}
                  onClick={onConfirm}
                  className={`flex-1 text-white font-bold text-xs py-5 border-none shadow-md cursor-pointer ${
                    variant === 'destructive'
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/10'
                      : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10'
                  }`}
                >
                  {confirmText}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={onConfirm}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 border-none shadow-md shadow-amber-500/10 cursor-pointer"
              >
                {confirmText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
