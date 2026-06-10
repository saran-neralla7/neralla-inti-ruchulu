import { create } from 'zustand';

interface ModalOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ModalState {
  isOpen: boolean;
  type: 'confirm' | 'alert';
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  isDestructive: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  showConfirm: (options: ModalOptions) => void;
  showAlert: (options: Omit<ModalOptions, 'cancelText' | 'onCancel'>) => void;
  close: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  type: 'alert',
  title: '',
  description: '',
  confirmText: 'OK',
  cancelText: 'Cancel',
  isDestructive: false,
  onConfirm: undefined,
  onCancel: undefined,
  
  showConfirm: (options) => set({
    isOpen: true,
    type: 'confirm',
    title: options.title,
    description: options.description,
    confirmText: options.confirmText || 'Confirm',
    cancelText: options.cancelText || 'Cancel',
    isDestructive: options.isDestructive ?? false,
    onConfirm: options.onConfirm,
    onCancel: options.onCancel,
  }),
  
  showAlert: (options) => set({
    isOpen: true,
    type: 'alert',
    title: options.title,
    description: options.description,
    confirmText: options.confirmText || 'OK',
    cancelText: 'Cancel',
    isDestructive: options.isDestructive ?? false,
    onConfirm: options.onConfirm,
    onCancel: undefined,
  }),
  
  close: () => set({ isOpen: false }),
}));
