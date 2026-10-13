'use client';

import { cn } from 'cn';
import { Eye, EyeOff } from 'lucide-react';
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
} from 'react';

import { Input } from '@/components/ui/input';

type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'>;

export function PasswordInput({
  ref,
  className,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current!, []);

  // Al enviar se vuelve a ocultar, para que la contraseña no quede a la vista si el envío
  // falla y la persona se aleja del equipo.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const hide = () => setVisible(false);
    form.addEventListener('submit', hide);
    return () => form.removeEventListener('submit', hide);
  }, []);

  const label = visible ? 'Ocultar contraseña' : 'Mostrar contraseña';
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type={visible ? 'text' : 'password'}
        className={cn('pr-12', className)}
        {...props}
      />
      <button
        type="button"
        aria-label={label}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
      >
        <Icon className="size-4.5" aria-hidden="true" />
      </button>
    </div>
  );
}
