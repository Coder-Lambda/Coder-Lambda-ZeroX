import { t } from '../../../i18n/pt-BR'
import { Dialog } from '../../../ui/Dialog'
import type { FinanceDialog } from '../FinanceContext'
import { AccountsPanel } from './AccountsPanel'
import { EntryForm } from './EntryForm'
import { LabelForm } from './LabelForm'
import { PayForm } from './PayForm'
import { TitleForm } from './TitleForm'
import { TitlesList } from './TitlesList'

/** One host for every finance dialog; opening one closes the previous. */
export function FinanceDialogs({ dialog, onClose }: { dialog: FinanceDialog | null; onClose: () => void }) {
  const entryTitle =
    dialog?.type === 'entry'
      ? dialog.entry
        ? t.finance.entry.edit
        : dialog.preset?.source
          ? t.business.payTitle[dialog.preset.source]
          : (dialog.entryType ?? dialog.preset?.type) === 'in'
            ? t.finance.entry.newIn
            : t.finance.entry.newOut
      : ''
  const titleTitle =
    dialog?.type === 'title'
      ? dialog.title
        ? t.finance.title.edit
        : (dialog.kind ?? 'payable') === 'payable'
          ? t.finance.title.newPayable
          : t.finance.title.newReceivable
      : ''

  return (
    <>
      <Dialog open={dialog?.type === 'accounts'} onClose={onClose} title={t.finance.accounts.title}>
        {dialog?.type === 'accounts' && <AccountsPanel hint={dialog.hint} then={dialog.then} />}
      </Dialog>
      <Dialog open={dialog?.type === 'entry'} onClose={onClose} title={entryTitle}>
        {dialog?.type === 'entry' && (
          <EntryForm entry={dialog.entry} initialType={dialog.entryType} preset={dialog.preset} onDone={onClose} />
        )}
      </Dialog>
      <Dialog open={dialog?.type === 'title'} onClose={onClose} title={titleTitle}>
        {dialog?.type === 'title' && (
          <TitleForm title={dialog.title} initialKind={dialog.kind} initialDue={dialog.dueDate} onDone={onClose} />
        )}
      </Dialog>
      <Dialog
        open={dialog?.type === 'pay'}
        onClose={onClose}
        title={dialog?.type === 'pay' && dialog.title.kind === 'receivable' ? t.finance.pay.titleReceive : t.finance.pay.titlePay}
      >
        {dialog?.type === 'pay' && <PayForm title={dialog.title} onDone={onClose} />}
      </Dialog>
      <Dialog
        open={dialog?.type === 'titles'}
        onClose={onClose}
        title={dialog?.type === 'titles' ? t.finance.title.listTitle[dialog.kind] : ''}
        size="lg"
      >
        {dialog?.type === 'titles' && <TitlesList kind={dialog.kind} />}
      </Dialog>
      <Dialog
        open={dialog?.type === 'label'}
        onClose={onClose}
        title={
          dialog?.type !== 'label'
            ? ''
            : dialog.label
              ? t.business.labels.editTitle
              : dialog.labelType === 'in'
                ? t.business.labels.newIn
                : t.business.labels.newOut
        }
      >
        {dialog?.type === 'label' && <LabelForm type={dialog.labelType} label={dialog.label} onDone={onClose} />}
      </Dialog>
    </>
  )
}
