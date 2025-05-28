import React from 'react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/contexts/ToastContext';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, type, title, description }) => (
        <Toast
          key={id}
          variant={type === 'error' ? 'destructive' : 'default'}
          className={`${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
            type === 'info' ? 'bg-blue-500 text-white' :
            ''
          }`}
        >
          <div className="grid gap-1">
            <ToastTitle>{title}</ToastTitle>
            {description && (
              <ToastDescription>{description}</ToastDescription>
            )}
          </div>
          <ToastClose onClick={() => removeToast(id)} />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}; 