'use client'

// ---------------------------------------------------------------------------
// 🗂️ FilesAdminTab — Admin → File Manager (Part 5)
//
// One shared educational file store: upload (PDF/DOCX/XLSX/CSV/TXT/MP3/WAV/
// M4A/MP4/JPG/PNG/WebP/GIF), search, filter by kind, preview (images/audio/
// video inline, others download), rename, replace, delete, and see how many
// lessons/questions reference each file so nothing is orphaned by accident.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, FileSearch, Loader2, Pencil, RefreshCw, Trash2, Upload } from 'lucide-react'

interface FileRow {
  id: string
  title: string
  fileName: string
  mimeType: string
  size: number
  sizeLabel: string
  kind: string
  url: string
  createdAt: string
  usedBy: number
}

const KIND_FILTERS = [
  { key: '', label: 'All' },
  { key: 'image', label: 'Images' },
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Video' },
  { key: 'document', label: 'Documents' },
  { key: 'data', label: 'Data (CSV/TXT)' },
]

function kindEmoji(kind: string): string {
  const map: Record<string, string> = { image: '🖼️', audio: '🎧', video: '🎬', document: '📄', data: '📊', other: '🗂️' }
  return map[kind] ?? '🗂️'
}

export function FilesAdminTab({
  token,
  onToast,
}: {
  token: string
  onToast: (m: string) => void
}) {
  const [files, setFiles] = useState<FileRow[] | null>(null)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [uploadTitle, setUploadTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [renaming, setRenaming] = useState<FileRow | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [preview, setPreview] = useState<FileRow | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const params = new URLSearchParams()
      if (query) params.set('query', query)
      if (kind) params.set('kind', kind)
      const res = await fetch(`/api/admin/files?${params.toString()}`, {
        headers: { 'x-admin-key': token },
        cache: 'no-store',
      })
      if (!res.ok) {
        setFiles([])
        setError('Could not load files.')
        return
      }
      const data = await res.json()
      setFiles(Array.isArray(data.files) ? data.files : [])
    } catch {
      setFiles([])
      setError('Could not load files.')
    }
  }, [token, query, kind])

  useEffect(() => {
    const t = setTimeout(() => void load(), 250)
    return () => clearTimeout(t)
  }, [load])

  const upload = async () => {
    if (!file || busy) return
    setBusy(true)
    setError('')
    try {
      const fd = new FormData()
      fd.set('file', file)
      if (uploadTitle) fd.set('title', uploadTitle)
      const res = await fetch('/api/admin/files', {
        method: 'POST',
        headers: { 'x-admin-key': token },
        body: fd,
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(d?.error || 'Upload failed.')
        return
      }
      onToast('File uploaded')
      setFile(null)
      setUploadTitle('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      void load()
    } catch {
      setError('Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  const rename = async () => {
    if (!renaming) return
    const res = await fetch(`/api/admin/files/${renaming.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
      body: JSON.stringify({ title: renameValue }),
    })
    if (res.ok) {
      onToast('File renamed')
      setRenaming(null)
      void load()
    } else {
      onToast('Rename failed')
    }
  }

  const replace = async (row: FileRow, f: File) => {
    const fd = new FormData()
    fd.set('file', f)
    const res = await fetch(`/api/admin/files/${row.id}`, {
      method: 'PATCH',
      headers: { 'x-admin-key': token },
      body: fd,
    })
    const d = await res.json().catch(() => ({}))
    if (res.ok) {
      onToast('File replaced — every lesson using it now shows the new version')
      void load()
    } else {
      onToast(d?.error || 'Replace failed')
    }
  }

  const remove = async (row: FileRow) => {
    if (!window.confirm(`Delete “${row.title || row.fileName}”? Lessons referencing it will lose the attachment.`)) return
    const res = await fetch(`/api/admin/files/${row.id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': token },
    })
    if (res.ok) {
      onToast('File deleted')
      void load()
    }
  }

  const isInlinePreview = (f: FileRow) =>
    f.mimeType.startsWith('image/') || f.mimeType.startsWith('audio/') || f.mimeType === 'video/mp4'

  return (
    <div className="space-y-6">
      {/* upload */}
      <div className="bg-white rounded-2xl border border-sage-light/30 p-5 space-y-4">
        <h3 className="text-sm font-bold text-brown-dark flex items-center gap-2">
          <Upload className="w-4 h-4 text-sage-dark" aria-hidden="true" /> Upload educational file
        </h3>
        <p className="text-[11px] text-brown-light bg-cream/70 border border-sage-light/25 rounded-xl px-3.5 py-2.5 leading-relaxed">
          PDF, DOCX, XLSX, CSV, TXT, MP3, WAV, M4A, MP4, JPG, PNG, WebP, GIF — up to 4 MB
          (the Vercel serverless body limit). The real type is checked from the file content.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="edu-file" className="block text-xs font-semibold uppercase tracking-wider text-brown mb-1.5">
              File
            </label>
            <input
              id="edu-file"
              ref={fileInputRef}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-brown file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-sage-light/40 file:text-brown-dark file:text-xs file:font-bold file:cursor-pointer"
            />
          </div>
          <div>
            <label htmlFor="edu-file-title" className="block text-xs font-semibold uppercase tracking-wider text-brown mb-1.5">
              Title (optional)
            </label>
            <input
              id="edu-file-title"
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g. HSK 1 Workbook Chapter 3"
              maxLength={120}
              className="w-full bg-cream/60 border border-sage-light/40 rounded-xl px-4 py-2.5 text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:border-sage"
            />
          </div>
        </div>
        {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
        <button
          type="button"
          onClick={() => void upload()}
          disabled={busy || !file}
          className="bg-sage text-brown-dark px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />}
          {busy ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      {/* search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FileSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-light/70" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files…"
            aria-label="Search files"
            className="w-full bg-white border border-sage-light/40 rounded-full pl-10 pr-4 py-2.5 text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {KIND_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setKind(f.key)}
              aria-pressed={kind === f.key}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer min-h-[36px] ${
                kind === f.key ? 'bg-sage text-brown-dark' : 'bg-white border border-sage-light/40 text-brown hover:border-sage'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void load()}
            aria-label="Refresh files"
            className="p-2.5 rounded-full bg-white border border-sage-light/40 text-brown hover:border-sage cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* list */}
      {files === null ? (
        <p className="text-sm text-brown-light flex items-center gap-2 py-10 justify-center" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading files…
        </p>
      ) : files.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-sage-light/50">
          <p className="text-sm text-brown-light">No files yet — upload the first one above.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[62vh] overflow-y-auto pr-1">
          {files.map((f) => (
            <div key={f.id} className="bg-white rounded-2xl border border-sage-light/25 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-brown-dark truncate">
                    {kindEmoji(f.kind)} {f.title || f.fileName}
                  </p>
                  <p className="text-[11px] text-brown-light mt-0.5">
                    {f.fileName} · {f.sizeLabel} · {f.usedBy > 0 ? `used in ${f.usedBy} place${f.usedBy > 1 ? 's' : ''}` : 'not referenced yet'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreview(f)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-cream text-brown hover:bg-cream-dark cursor-pointer"
                  >
                    Preview
                  </button>
                  <a
                    href={f.url}
                    download={f.fileName}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-cream text-brown hover:bg-cream-dark cursor-pointer inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" aria-hidden="true" /> Download
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setRenaming(f)
                      setRenameValue(f.title)
                    }}
                    aria-label={`Rename ${f.fileName}`}
                    className="p-2 rounded-full bg-cream text-brown hover:bg-cream-dark cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <label
                    className="p-2 rounded-full bg-cream text-brown hover:bg-cream-dark cursor-pointer"
                    title="Replace file"
                  >
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f2 = e.target.files?.[0]
                        if (f2) void replace(f, f2)
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void remove(f)}
                    aria-label={`Delete ${f.fileName}`}
                    className="p-2 rounded-full bg-peach-light/40 text-peach-dark hover:bg-peach/40 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* rename dialog */}
      {renaming && (
        <div className="fixed inset-0 z-50 bg-brown-dark/40 flex items-center justify-center p-4" role="dialog" aria-label="Rename file">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-sm font-bold text-brown-dark">Rename file</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              maxLength={120}
              className="w-full bg-cream/60 border border-sage-light/40 rounded-xl px-4 py-2.5 text-sm text-brown focus:outline-none focus:border-sage"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRenaming(null)} className="px-4 py-2 rounded-xl text-sm text-brown bg-cream hover:bg-cream-dark cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={() => void rename()} className="px-4 py-2 rounded-xl text-sm font-bold text-brown-dark bg-sage hover:bg-sage-dark cursor-pointer">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* preview dialog */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-brown-dark/50 flex items-center justify-center p-4" role="dialog" aria-label="Preview file">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-brown-dark truncate">{preview.title || preview.fileName}</h3>
              <button type="button" onClick={() => setPreview(null)} className="px-3 py-1.5 rounded-full text-xs font-bold bg-cream hover:bg-cream-dark cursor-pointer">
                Close
              </button>
            </div>
            {preview.mimeType.startsWith('image/') && (
               
              <img src={preview.url} alt={preview.fileName} className="max-h-[60vh] w-auto mx-auto rounded-2xl" />
            )}
            {preview.mimeType.startsWith('audio/') && (
              <audio controls src={preview.url} className="w-full">
                <track kind="captions" />
              </audio>
            )}
            {preview.mimeType === 'video/mp4' && (
              <video controls src={preview.url} className="w-full max-h-[60vh] rounded-2xl" />
            )}
            {!isInlinePreview(preview) && (
              <p className="text-sm text-brown-light">
                No inline preview for this format — use Download above.
              </p>
            )}
            <p className="text-[11px] text-brown-light font-mono break-all">{preview.mimeType}</p>
          </div>
        </div>
      )}
    </div>
  )
}
