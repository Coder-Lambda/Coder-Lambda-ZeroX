import { useEffect, useState } from 'react'
import { FileText, Paperclip, Trash2 } from 'lucide-react'
import { fileStore } from '../../../data/fileStore'
import { t } from '../../../i18n/pt-BR'
import { formatBytes, formatDateTime } from '../../../lib/format'
import { ConfirmDialog } from '../../../ui/Dialog'
import { removeFile } from '../store'
import type { EmployeeFile } from '../types'

export const MAX_FILE_BYTES = 15 * 1024 * 1024

const viewable = (type: string) => type.startsWith('image/') || type === 'application/pdf'

async function openFile(file: EmployeeFile) {
  const blob = await fileStore.get(file.id)
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.rel = 'noopener'
  if (viewable(file.type)) link.target = '_blank'
  else link.download = file.name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function FilesSection({ files, onAdd }: { files: EmployeeFile[]; onAdd: () => void }) {
  const [removing, setRemoving] = useState<EmployeeFile | null>(null)
  const sorted = [...files].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <section className="glass card span-6">
      <div className="section-head">
        <div>
          <h2 className="card-title mb-0">{t.collab.files.title}</h2>
          <p className="text-2 text-[13px]">{t.collab.files.sub}</p>
        </div>
        <button type="button" className="btn btn-secondary tactile" onClick={onAdd}>
          <Paperclip />
          {t.collab.card.addFile}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-2 mt-2 text-[13px]">{t.collab.files.empty}</p>
      ) : (
        <ul className="file-grid">
          {sorted.map((file) => (
            <li key={file.id} className="file-tile well">
              <button type="button" className="file-open tactile" onClick={() => void openFile(file)} title={t.collab.files.open}>
                {file.type.startsWith('image/') ? <Thumbnail file={file} /> : <FileText className="file-icon" />}
              </button>
              <div className="file-meta">
                <span className="file-name" title={file.name}>
                  {file.name}
                </span>
                <span className="num text-2 text-[12px]">
                  {formatBytes(file.size)} · {formatDateTime(file.createdAt)}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-icon btn-ghost tactile"
                aria-label={`${t.collab.files.remove} ${file.name}`}
                onClick={() => setRemoving(file)}
              >
                <Trash2 />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={t.collab.files.removeTitle}
        message={removing ? t.collab.files.removeMessage(removing.name) : ''}
        confirmLabel={t.collab.files.remove}
        danger
        onConfirm={() => removing && void removeFile(removing)}
      />
    </section>
  )
}

function Thumbnail({ file }: { file: EmployeeFile }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let alive = true
    fileStore.get(file.id).then((blob) => {
      if (!alive || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    })
    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file.id])

  return url ? <img src={url} alt="" className="file-thumb" loading="lazy" decoding="async" /> : <span className="file-thumb shimmer" />
}
