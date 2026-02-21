import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', color: '#e05252' },
  { value: 'in-progress', label: 'In Progress', color: '#d4a017' },
  { value: 'done', label: 'Done', color: '#3fad72' }
]

const SAVE_DELAY = 700

export default function FloatingNoteView({ filePath }) {
  const [note, setNote] = useState(null)
  const [mode, setMode] = useState('edit')
  const [localTitle, setLocalTitle] = useState('')
  const [localContent, setLocalContent] = useState('')
  const [localStatus, setLocalStatus] = useState('open')
  const [saveState, setSaveState] = useState('saved')
  const [pinned, setPinned] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!filePath) return
    window.api.fs.getNote(filePath).then((n) => {
      if (!n) return
      setNote(n)
      setLocalTitle(n.title ?? '')
      setLocalContent(n.content ?? '')
      setLocalStatus(n.status ?? 'open')
    })
  }, [filePath])

  const scheduleSave = (title, content, status) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setSaveState('saving')
    timerRef.current = setTimeout(async () => {
      try {
        await window.api.fs.updateNote({ filePath, title, content, status })
        setSaveState('saved')
        window.api.floatingWindow.noteSaved(filePath)
      } catch (err) {
        console.error('Save failed', err)
        setSaveState('saved')
      }
    }, SAVE_DELAY)
  }

  const handleTitleChange = (e) => {
    const val = e.target.value
    setLocalTitle(val)
    scheduleSave(val, localContent, localStatus)
  }

  const handleContentChange = (e) => {
    const val = e.target.value
    setLocalContent(val)
    scheduleSave(localTitle, val, localStatus)
  }

  const handleStatusChange = (e) => {
    const val = e.target.value
    setLocalStatus(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    window.api.fs
      .updateNote({ filePath, title: localTitle, content: localContent, status: val })
      .then(() => { setSaveState('saved'); window.api.floatingWindow.noteSaved(filePath) })
  }

  const handleTogglePin = async () => {
    const next = !pinned
    setPinned(next)
    await window.api.floatingWindow.setAlwaysOnTop(next)
  }

  if (!note) {
    return (
      <div className="floating-view">
        <p className="empty-hint">Loading note…</p>
      </div>
    )
  }

  const statusColor = STATUS_OPTIONS.find((s) => s.value === localStatus)?.color ?? '#e05252'

  return (
    <div className="floating-view">
      {/* Toolbar */}
      <div className="floating-toolbar">
        <input
          className="editor-title floating-title"
          value={localTitle}
          onChange={handleTitleChange}
          placeholder="Note title…"
        />
        <div className="floating-toolbar-actions">
          <select
            className="status-select"
            value={localStatus}
            onChange={handleStatusChange}
            style={{ borderColor: statusColor, color: statusColor }}
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
            >
              Edit
            </button>
            <button
              className={`mode-btn ${mode === 'preview' ? 'active' : ''}`}
              onClick={() => setMode('preview')}
            >
              Preview
            </button>
          </div>

          <button
            className={`pin-btn ${pinned ? 'pinned' : ''}`}
            onClick={handleTogglePin}
            title={pinned ? 'Unpin window' : 'Keep window on top'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L8 6H4l4 4-4 8 8-4 4 4V6l-4-4z" />
            </svg>
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
            placeholder="Write in Markdown…"
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
        <span className="editor-meta floating-path" title={filePath}>
          {filePath.split(/[\\/]/).pop()}
        </span>
        <span className={`save-indicator ${saveState}`}>
          {saveState === 'saving' ? 'Saving…' : 'Saved'}
        </span>
      </div>
    </div>
  )
}
