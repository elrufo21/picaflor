import { create } from "zustand";
import type { ReactNode } from "react";

export type DialogSize = "sm" | "md" | "lg" | "xl";
export type DialogPayload = Record<string, unknown>;

export type DialogContext = {
  payload: DialogPayload;
  setPayload: (
    updater:
      | DialogPayload
      | ((prev: DialogPayload) => DialogPayload)
  ) => void;
  close: () => void;
};

export type DialogConfig = {
  title?: string;
  description?: string;
  size?: DialogSize;
  content: (context: DialogContext) => ReactNode;
  showFooter?: boolean;
  confirmLabel?: string;
  dangerLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  disableClose?: boolean;
  initialPayload?: DialogPayload;
  onConfirm?: (
    payload: DialogPayload
  ) => void | boolean | Promise<void | boolean>;
  onDanger?: (
    payload: DialogPayload
  ) => void | boolean | Promise<void | boolean>;
  onClose?: () => void;
};

type DialogState = {
  isOpen: boolean;
  payload: DialogPayload;
  config: DialogConfig | null;
  openDialog: (config: DialogConfig) => void;
  closeDialog: () => void;
  setPayload: DialogContext["setPayload"];
  resetPayload: () => void;
};

export const useDialogStore = create<DialogState>((set, get) => ({
  isOpen: false,
  payload: {},
  config: null,
  openDialog: (config) =>
    set({
      isOpen: true,
      config,
      payload: config.initialPayload ?? {},
    }),
  closeDialog: () => {
    const current = get().config;
    if (current?.onClose) current.onClose();
    set({ isOpen: false, config: null, payload: {} });
  },
  setPayload: (updater) =>
    set((state) => ({
      payload:
        typeof updater === "function"
          ? (updater as (prev: DialogPayload) => DialogPayload)(state.payload)
          : updater,
    })),
  resetPayload: () => set({ payload: get().config?.initialPayload ?? {} }),
}));
