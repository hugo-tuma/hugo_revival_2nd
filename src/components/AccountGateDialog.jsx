import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

/**
 * Shared explanation dialog for actions that need a real signed-in identity
 * (RLS ties the write to auth.uid()) in an app with no auth in this pass —
 * same pattern GroupsView/LibraryView already use for "+ New group" and
 * adding a playlist, so every gated action explains itself the same way
 * instead of just doing nothing.
 */
export default function AccountGateDialog({ trigger, title, children }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-overlay-in fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="animate-dialog-in fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm border border-black bg-white">
          <div className="flex items-center justify-between border-b border-black bg-black px-3 py-2 text-white">
            <Dialog.Title className="font-mono text-xs uppercase tracking-wider">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close">
                <X size={15} strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="p-4 font-sans text-xs text-neutral-600">{children}</Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
