'use client';

import { useState } from 'react';

import { Alert } from '@/components/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { useHasPermission } from '@/features/auth/permissions';
import { actionErrorMessage } from '@/lib/action-feedback';
import { formatShortDate, todayInBogota } from '@/lib/format/dates';
import { formatMoney } from '@/lib/format/money';
import { parseAmount } from '@/lib/validation/amount';

import {
  useAddExpense,
  useExpenses,
  useRemoveExpense,
  type ExpenseCategory,
  type Period,
} from '../api';

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: 'Arriendo',
  payroll: 'Nómina',
  marketing: 'Publicidad',
  utilities: 'Servicios públicos',
  taxes: 'Impuestos',
  software: 'Software',
  other: 'Otro',
};

function AddExpenseForm() {
  const add = useAddExpense();
  const [spentOn, setSpentOn] = useState(todayInBogota());
  const [category, setCategory] = useState<ExpenseCategory>('rent');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string>();

  const save = () => {
    const parsed = parseAmount(amount, 'COP');
    if (!description.trim()) return setError('Indica en qué se gastó.');
    if ('error' in parsed) return setError(parsed.error);
    setError(undefined);
    add.mutate(
      {
        spent_on: spentOn,
        category,
        description: description.trim(),
        amount: Number(parsed.value),
      },
      {
        onSuccess: () => {
          setDescription('');
          setAmount('');
        },
        onError: (failure) => setError(actionErrorMessage(failure)),
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 border-t px-5 py-4">
      {error && <Alert title={error} />}
      <div className="grid gap-3 md:grid-cols-[10rem_11rem_1fr_9rem_auto] md:items-end">
        <div className="flex flex-col gap-2">
          <Label htmlFor="expense-date">Fecha</Label>
          <Input
            id="expense-date"
            type="date"
            className="h-11"
            value={spentOn}
            onChange={(event) => setSpentOn(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expense-category">Categoría</Label>
          <NativeSelect
            id="expense-category"
            className="w-full"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ExpenseCategory)
            }
          >
            {Object.entries(CATEGORY_LABELS).map(([code, label]) => (
              <NativeSelectOption key={code} value={code}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expense-description">Descripción</Label>
          <Input
            id="expense-description"
            maxLength={200}
            className="h-11"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expense-amount">Valor (COP)</Label>
          <Input
            id="expense-amount"
            inputMode="numeric"
            className="h-11"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <Button onClick={save} disabled={add.isPending}>
          Registrar gasto
        </Button>
      </div>
    </div>
  );
}

// Los gastos de funcionamiento de la agencia en el período: arriendo, nómina, publicidad…
export function ExpensesSection({ period }: { period: Period }) {
  const canManage = useHasPermission('finance.manage');
  const expenses = useExpenses(period);
  const remove = useRemoveExpense();
  const rows = expenses.data?.results ?? [];

  return (
    <section
      aria-labelledby="expenses-title"
      className="rounded-md border bg-card"
    >
      <h2
        id="expenses-title"
        className="border-b px-5 py-4 font-heading text-lg font-semibold"
      >
        Gastos operativos
      </h2>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          No hay gastos registrados en este período.
        </p>
      ) : (
        <ul className="divide-y">
          {rows.map((expense) => (
            <li
              key={expense.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"
            >
              <span className="text-muted-foreground">
                {formatShortDate(expense.spent_on)}
              </span>
              <span className="font-medium">{expense.description}</span>
              <span className="text-muted-foreground">
                {CATEGORY_LABELS[expense.category]}
              </span>
              <span>{formatMoney(expense.amount)}</span>
              {canManage && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(expense.id)}
                >
                  Quitar
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canManage && <AddExpenseForm />}
    </section>
  );
}
