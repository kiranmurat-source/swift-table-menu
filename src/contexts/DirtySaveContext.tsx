import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type SaveFn = () => void | Promise<void>;
type CancelFn = () => void;

interface DirtySaveState {
  isDirty: boolean;
  saving: boolean;
  setDirtyState: (dirty: boolean, onSave?: SaveFn, onCancel?: CancelFn, label?: string) => void;
  clearDirtyState: () => void;
  triggerSave: () => void;
  requestCancel: () => void;
  saveLabel: string;
}

const DirtySaveContext = createContext<DirtySaveState | null>(null);

export function DirtySaveProvider({ children }: { children: ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState('Kaydet');
  const [handlers, setHandlers] = useState<{ onSave: SaveFn | null; onCancel: CancelFn | null }>({
    onSave: null,
    onCancel: null,
  });

  const setDirtyState = useCallback(
    (dirty: boolean, onSave?: SaveFn, onCancel?: CancelFn, label?: string) => {
      setIsDirty(dirty);
      setHandlers({ onSave: onSave ?? null, onCancel: onCancel ?? null });
      if (label) setSaveLabel(label);
    },
    [],
  );

  const clearDirtyState = useCallback(() => {
    setIsDirty(false);
    setHandlers({ onSave: null, onCancel: null });
    setSaveLabel('Kaydet');
  }, []);

  const triggerSave = useCallback(async () => {
    if (!handlers.onSave || saving) return;
    setSaving(true);
    try {
      await handlers.onSave();
    } finally {
      setSaving(false);
    }
  }, [handlers, saving]);

  const requestCancel = useCallback(() => {
    if (!isDirty) {
      handlers.onCancel?.();
      return;
    }
    setConfirmOpen(true);
  }, [isDirty, handlers]);

  const acceptCancel = useCallback(() => {
    setConfirmOpen(false);
    handlers.onCancel?.();
  }, [handlers]);

  return (
    <DirtySaveContext.Provider
      value={{
        isDirty,
        saving,
        setDirtyState,
        clearDirtyState,
        triggerSave,
        requestCancel,
        saveLabel,
      }}
    >
      {children}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Değişiklikler kaybolacak</AlertDialogTitle>
            <AlertDialogDescription>
              Yaptığınız değişiklikler kaydedilmeyecek. Devam etmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={acceptCancel}>Evet, vazgeç</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DirtySaveContext.Provider>
  );
}

export function useDirtySave() {
  const ctx = useContext(DirtySaveContext);
  if (!ctx) throw new Error('useDirtySave must be used within DirtySaveProvider');
  return ctx;
}
