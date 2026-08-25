import { create } from 'zustand';

interface DialogOptions {
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isAlert?: boolean;
  type?: 'info' | 'success' | 'warning' | 'danger';
}

interface DialogState {
  isOpen: boolean;
  options: DialogOptions | null;
  resolve: ((value: boolean) => void) | null;
  showDialog: (options: DialogOptions) => Promise<boolean>;
  closeDialog: (result: boolean) => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  isOpen: false,
  options: null,
  resolve: null,
  
  showDialog: (options) => {
    return new Promise((resolve) => {
      set({ isOpen: true, options, resolve });
    });
  },

  closeDialog: (result) => {
    const { resolve } = get();
    if (resolve) resolve(result);
    set({ isOpen: false, resolve: null });
    
    // Pulisci le opzioni dopo l'animazione di uscita
    setTimeout(() => {
      if (!get().isOpen) set({ options: null });
    }, 300);
  }
}));
