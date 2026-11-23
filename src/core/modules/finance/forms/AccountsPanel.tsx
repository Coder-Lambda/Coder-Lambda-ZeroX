import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { newId } from '../../../data/localDb'
import { useScope } from '../../../data/useTable'
import { t } from '../../../i18n/pt-BR'
import { compareNames, moneyInputValue, parseMoney } from '../../../lib/format'
import { haptic } from '../../../lib/haptic'
import { ConfirmDialog } from '../../../ui/Dialog'
import { TextInput } from '../../../ui/TextInput'
import { toast } from '../../../ui/Toaster'
import { useFinanceContext } from '../FinanceContext'
import { balanceAt, deleteAccount, saveAccount } from '../store'
import type { FinAccount } from '../types'
import { Money } from '../widgets/WidgetCard'
import { FieldError } from './fields'

/** List of accounts with their balances; add, rename or remove them. */
export function AccountsPanel({ hint }: { hint?: boolean }) {
  const { data, today } = useFinanceContext()
  const [editing, setEditing] = useState<FinAccount | 'new' | null>(data.accounts.length === 0 ? 'new' : null)
  const [deleting, setDeleting] = useState<FinAccount | null>(null)
  const accounts = [...data.accounts].sort((a, b) => compareNames(a.name, b.name))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-2 text-[13px]">{hint ? t.finance.needAccountFirst : t.finance.accounts.sub}</p>

      {accounts.length > 0 && (
        <ul className="toggle-list">
          {accounts.map((account) =>
            editing !== 'new' && editing?.id === account.id ? (
              <li key={account.id} className="well p-4">
                <AccountForm account={account} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li key={account.id} className="well toggle-list-row">
                <span className="fin-mini-name">{account.name}</span>
                <span className="ml-auto flex items-center gap-1">
                  <Money value={balanceAt(data, today, account.id)} className="num mr-2" />
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost tactile"
                    aria-label={`${t.common.edit} ${account.name}`}
                    onClick={() => setEditing(account)}
                  >
                    <Pencil />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost tactile"
                    aria-label={`${t.common.delete} ${account.name}`}
                    onClick={() => setDeleting(account)}
                  >
                    <Trash2 />
                  </button>
                </span>
              </li>
            ),
          )}
        </ul>
      )}

      {editing === 'new' ? (
        <div className="well p-4">
          <AccountForm onDone={() => setEditing(null)} />
        </div>
      ) : (
        <div>
          <button type="button" className="btn btn-primary tactile" onClick={() => setEditing('new')}>
            <Plus />
            {t.finance.accounts.add}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={deleting ? t.finance.accounts.deleteTitle(deleting.name) : ''}
        message={t.finance.accounts.deleteMessage}
        confirmLabel={t.common.delete}
        danger
        onConfirm={() => {
          if (!deleting) return
          if (data.entries.some((e) => e.accountId === deleting.id)) {
            toast(t.finance.accounts.hasEntries, 'error')
            return
          }
          deleteAccount(deleting)
          toast(t.finance.accounts.deleted(deleting.name))
        }}
      />
    </div>
  )
}

function AccountForm({ account, onDone }: { account?: FinAccount; onDone: () => void }) {
  const { book } = useFinanceContext()
  const scope = useScope()
  const [name, setName] = useState(account?.name ?? '')
  const [initial, setInitial] = useState(moneyInputValue(account?.initialBalance ?? 0))
  const [invalid, setInvalid] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setInvalid(true)
      haptic('error')
      return
    }
    saveAccount({
      id: account?.id ?? newId('acc'),
      ...scope,
      book,
      name: name.trim(),
      initialBalance: parseMoney(initial) ?? 0,
      createdAt: account?.createdAt ?? new Date().toISOString(),
    })
    haptic('success')
    toast(account ? t.finance.accounts.saved : t.finance.accounts.added(name.trim()))
    onDone()
  }

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      <div>
        <TextInput
          id={`account-name-${account?.id ?? 'new'}`}
          label={t.finance.accounts.name}
          value={name}
          onChange={(v) => {
            setName(v)
            setInvalid(false)
          }}
          placeholder={t.finance.accounts.namePlaceholder}
          autoFocus
          invalid={invalid}
          describedBy="account-name-error"
        />
        <FieldError id="account-name-error" message={invalid ? t.finance.accounts.nameRequired : null} />
      </div>
      <TextInput
        id={`account-initial-${account?.id ?? 'new'}`}
        label={t.finance.accounts.initialBalance}
        value={initial}
        onChange={setInitial}
        inputMode="decimal"
        prefix="R$"
      />
      <div className="form-actions span-2">
        <button type="button" className="btn btn-secondary tactile" onClick={onDone}>
          {t.common.cancel}
        </button>
        <button type="submit" className="btn btn-primary tactile">
          {account ? t.common.save : t.finance.accounts.add}
        </button>
      </div>
    </form>
  )
}
