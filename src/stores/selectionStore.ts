'use client';
import { create } from 'zustand';
import { nanoid } from 'nanoid';

interface SelectionState {
  selected: Set<number>;
  sessionId: string;
  toggle: (number: number) => void;
  clear: () => void;
  isSelected: (number: number) => boolean;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selected: new Set(),
  sessionId: nanoid(),
  toggle: (number) =>
    set((state) => {
      const next = new Set(state.selected);
      if (next.has(number)) {
        next.delete(number);
      } else {
        next.add(number);
      }
      return { selected: next };
    }),
  clear: () => set({ selected: new Set() }),
  isSelected: (number) => get().selected.has(number),
}));
