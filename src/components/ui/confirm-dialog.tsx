'use client';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Botón rojo para acciones destructivas (eliminar, rechazar). */
  destructive?: boolean;
}

interface PromptOptions extends Omit<ConfirmOptions, 'destructive'> {
  placeholder?: string;
  defaultValue?: string;
}

interface DialogState {
  kind: 'confirm' | 'prompt';
  options: ConfirmOptions & PromptOptions;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/** Reemplazo de window.confirm / window.prompt con el estilo de la app. */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const resolver = useRef<((result: boolean | string | null) => void) | null>(null);

  const close = useCallback((result: boolean | string | null) => {
    resolver.current?.(result);
    resolver.current = null;
    setOpen(false);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({ kind: 'confirm', options });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = (r) => resolve(r === true);
    });
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    setState({ kind: 'prompt', options });
    setValue(options.defaultValue ?? '');
    setOpen(true);
    return new Promise<string | null>((resolve) => {
      resolver.current = (r) => resolve(typeof r === 'string' ? r : null);
    });
  }, []);

  const options = state?.options;
  const isPrompt = state?.kind === 'prompt';
  const accept = () => close(isPrompt ? value.trim() || null : true);

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}
      <Dialog.Root open={open} onOpenChange={(next) => !next && close(isPrompt ? null : false)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            {options && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  accept();
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Dialog.Title className="text-base font-semibold text-zinc-50">{options.title}</Dialog.Title>
                  {options.description && (
                    <Dialog.Description className="text-sm text-zinc-400 whitespace-pre-line">
                      {options.description}
                    </Dialog.Description>
                  )}
                </div>
                {isPrompt && (
                  <Input
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={options.placeholder}
                    className="bg-zinc-950 border-zinc-700"
                  />
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" className="border-zinc-700" onClick={() => close(isPrompt ? null : false)}>
                    {options.cancelLabel ?? 'Cancelar'}
                  </Button>
                  <Button
                    type="submit"
                    autoFocus={!isPrompt}
                    disabled={isPrompt && !value.trim()}
                    className={cn(
                      options.destructive ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'
                    )}
                  >
                    {options.confirmLabel ?? 'Aceptar'}
                  </Button>
                </div>
              </form>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx;
}
