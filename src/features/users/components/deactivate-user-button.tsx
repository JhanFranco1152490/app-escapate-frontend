'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import type { ActionFeedback } from '../action-feedback';
import type { UserDetail } from '../api';
import { DeactivateUserDialog } from './deactivate-user-dialog';

type DeactivateUserButtonProps = {
  user: UserDetail;
  onDone: (feedback: ActionFeedback) => void;
};

export function DeactivateUserButton({
  user,
  onDone,
}: DeactivateUserButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Desactivar
      </Button>
      <DeactivateUserDialog
        user={user}
        open={open}
        onOpenChange={setOpen}
        onDone={onDone}
      />
    </>
  );
}
