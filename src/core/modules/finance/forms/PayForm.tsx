import { useState, type FormEvent } from 'react'
import { useScope } from '../../../data/useTable'
import { t } from '../../../i18n/pt-BR'
import { formatDateKey, moneyInputValue, parseMoney } from '../../../lib/format'
import { haptic } from '../../../lib/haptic'
import { TextInput } from '../../../ui/TextInput'
import { toast } from '../../../ui/Toaster'
import { useFinanceContext } from '../FinanceContext'
import { payTitle } from '../store'
import type { FinTitle } from '../types'
import { AccountSelect, FieldError } from './fields'

/** Settling a title records the money moving through an account, so the balance follows. */
export function PayForm({ title, onDone }: { title: FinTitle; onDone: () => void }) {
  const { data, today } = useFinanceContext()
  const scope = useScope()
  const receivable = title.kind === 'receivable'
  const [accountId, setAccountId] = useState(data.accounts[0]?.id ?? '')
  const [date, setDate] = useState(today)
  const [amount, setAmount] = useState(moneyInputValue(title.amount))
  const [invalid, setInvalid] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = parseMoney(amount)
    if (!value || value <= 0) {
      setInvalid(true)
      haptic('error')
      return
    }
    payTitle(scope, title, { accountId, date: date || today, amount: value })
    haptic('success')
    toast(receivable ? t.finance.pay.received : t.finance.pay.paid)
    onDone()
  }

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      <p className="span-2">
        <strong>{title.description}</strong>
        <span className="text-2"> · {t.finance.title.dueOn(formatDateKey(title.dueDate))}</span>
      </p>
      <div>
        <TextInput
          id="pay-amount"
          label={t.finance.pay.amount}
          value={amount}
          onChange={(v) => {
            setAmount(v)
            setInvalid(false)
          }}
          inputMode="decimal"
          prefix="R$"
          autoFocus
          invalid={invalid}
          describedBy="pay-amount-error"
        />
        <FieldError id="pay-amount-error" message={invalid ? t.finance.entry.amountRequired : null} />
      </div>
      <TextInput id="pay-date" label={t.finance.pay.date} value={date} onChange={setDate} type="date" />
      <div className="span-2">
        <AccountSelect
          id="pay-account"
          label={receivable ? t.finance.pay.accountIn : t.finance.pay.accountOut}
          accounts={data.accounts}
          value={accountId}
          onChange={setAccountId}
        />
      </div>
      <div className="form-actions span-2">
        <button type="button" className="btn btn-secondary tactile" onClick={onDone}>
          {t.common.cancel}
        </button>
        <button type="submit" className="btn btn-primary tactile">
          {receivable ? t.finance.pay.confirmReceive : t.finance.pay.confirmPay}
        </button>
      </div>
    </form>
  )
}
