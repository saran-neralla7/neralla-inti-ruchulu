import { useState } from 'react';
import { useModalStore } from '@/store/modalStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { Button } from './button';
import { AlertTriangle, Info, CheckCircle2, Loader2 } from 'lucide-react';

export function GlobalModal() {
  const {
    isOpen,
    type,
    title,
    description,
    confirmText,
    cancelText,
    isDestructive,
    onConfirm,
    onCancel,
    close,
  } = useModalStore();

  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsLoading(true);
      try {
        await onConfirm();
      } catch (err) {
        console.error('Error in modal confirm callback:', err);
      } finally {
        setIsLoading(false);
      }
    }
    close();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isLoading) handleCancel(); }}>
      <DialogContent className="sm:max-w-[440px] rounded-2xl border border-border bg-background p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader className="flex flex-row items-start gap-4 space-y-0 text-left">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isDestructive 
              ? 'bg-destructive/10 text-destructive' 
              : type === 'confirm' 
                ? 'bg-secondary/10 text-secondary' 
                : 'bg-primary/10 text-primary'
          }`}>
            {isDestructive ? (
              <AlertTriangle className="h-5 w-5" />
            ) : type === 'confirm' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Info className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-1.5 flex-1">
            <DialogTitle className="font-headline text-lg font-bold text-foreground pr-6">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-2">
          {type === 'confirm' && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="border-border hover:bg-muted text-muted-foreground rounded-xl font-semibold px-5 h-11"
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
            className={`rounded-xl font-semibold px-5 h-11 flex items-center justify-center gap-2 ${
              !isDestructive && 'bg-primary hover:bg-primary/90 text-white'
            }`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
