import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', color: '#e05252' },
  { value: 'in-progress', label: 'In Progress', color: '#d4a017' },
  { value: 'done', label: 'Done', color: '#3fad72' }
]

const SAVE_DELAY = 700 // ms

export default function NoteEditor({ note, onNoteUpdated }) {
  const [mode, setMode] = useState('edit')
  const [localTitle, setLocalTitle] = useState('')
  const [localContent, setLocalContent] = useState('')
  const [localStatus, setLocalStatus] = useState('open')
  const [saveState, setSaveState] = useState('saved') // 'saved' | 'saving'
  const timerRef = useRef(null)

  // Load note into local state when the selected note changes
  useEffect(() => {
    if (!note) return
    setLocalTitle(note.title ?? '')
    setLocalContent(note.content ?? '')
    setLocalStatus(note.status ?? 'open')
    setSaveState('saved')
    setMode('edit')
  }, [note?.id, note?.updatedAt])

  // Debounced save — captures folderPath and noteId at call time
  const scheduleSave = (folderPath, noteId, title, content, status) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setSaveState('saving')
    timerRef.current = setTimeout(async () => {
      try {
        await window.api.fs.updateNote({ folderPath, noteId, title, content, status })
        setSaveState('saved')
        onNoteUpdated()
      } catch (err) {
        console.error('Save failed', err)
        setSaveState('saved')
      }
    }, SAVE_DELAY)
  }

  const handleTitleChange = (e) => {
    const val = e.target.value
    setLocalTitle(val)
    scheduleSave(note.folderPath, note.id, val, localContent, localStatus)
  }

  const handleContentChange = (e) => {
    const val = e.target.value
    setLocalContent(val)
    scheduleSave(note.folderPath, note.id, localTitle, val, localStatus)
  }

  const handleContentKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.target
      const start = el.selectionStart
      const end = el.selectionEnd
      const spaces = '\t'
      const newVal = localContent.slice(0, start) + spaces + localContent.slice(end)
      setLocalContent(newVal)
      scheduleSave(note.folderPath, note.id, localTitle, newVal, localStatus)
      // Cursor hinter den eingefügten Leerzeichen platzieren
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + spaces.length
      })
    }
  }

  const handleStatusChange = (e) => {
    const val = e.target.value
    setLocalStatus(val)
    // Status change saves immediately
    if (timerRef.current) clearTimeout(timerRef.current)
    window.api.fs
      .updateNote({ folderPath: note.folderPath, noteId: note.id, title: localTitle, content: localContent, status: val })
      .then(() => { setSaveState('saved'); onNoteUpdated() })
  }

  if (!note) {
    return (
      <div className="note-editor empty-panel">
        <p className="empty-hint">Select a note to start editing</p>
      </div>
    )
  }

  const statusColor = STATUS_OPTIONS.find((s) => s.value === localStatus)?.color ?? '#e05252'

  return (
    <div className="note-editor">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <input
          className="editor-title"
          value={localTitle}
          onChange={handleTitleChange}
          placeholder="Note title..."
        />

        <select
          className="status-select"
          value={localStatus}
          onChange={handleStatusChange}
          style={{ borderColor: statusColor, color: statusColor }}
          tabIndex={-1}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'edit' ? 'active' : ''}`}
            onClick={() => setMode('edit')}
            tabIndex={-1}
          >
            Edit
          </button>
          <button
            className={`mode-btn ${mode === 'preview' ? 'active' : ''}`}
            onClick={() => setMode('preview')}
            tabIndex={-1}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="editor-body">
        {mode === 'edit' ? (
          <textarea
            className="editor-textarea"
            value={localContent}
            onChange={handleContentChange}
            onKeyDown={handleContentKeyDown}
            placeholder="Write in Markdown..."
            spellCheck={false}
          />
        ) : (
          <div className="editor-preview">
            <ReactMarkdown>{localContent}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="editor-footer">
        <span className="editor-meta">
          Created {fmt(note.createdAt)} &nbsp;&middot;&nbsp; Updated {fmt(note.updatedAt)}
        </span>
        <span className={`save-indicator ${saveState}`}>
          {saveState === 'saving' ? 'Saving...' : 'Saved'}
        </span>
      </div>
    </div>
  )
}

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
