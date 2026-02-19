import React, { useState, useEffect } from 'react'

const STATUS_CONFIG = {
  open: { label: 'Open', color: '#e05252' },
  'in-progress': { label: 'In Progress', color: '#d4a017' },
  done: { label: 'Done', color: '#3fad72' }
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' }
]

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open
  return (
    <span className="status-badge" style={{ backgroundColor: cfg.color }}>
      {cfg.label}
    </span>
  )
}

function NoteItem({ note, isSelected, onSelect, onDelete }) {
  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm('Delete this note?')) {
      onDelete(note.filePath)
    }
  }

  const date = note.updatedAt
    ? new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  return (
    <div
      className={`note-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(note)}
    >
      <div className="note-item-top">
        <span className="note-item-title">{note.title || 'Untitled'}</span>
        <button className="note-delete-btn" onClick={handleDelete} title="Delete note">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="note-item-bottom">
        <StatusBadge status={note.status} />
        <span className="note-item-date">{date}</span>
      </div>
    </div>
  )
}

export default function NoteList({
  notes,
  selectedNote,
  folderPath,
  onSelectNote,
  onCreateNote,
  onDeleteNote
}) {
  const [activeFilter, setActiveFilter] = useState('all')

  // Reset filter when switching folders
  useEffect(() => {
    setActiveFilter('all')
  }, [folderPath])

  if (!folderPath) {
    return (
      <div className="note-list empty-panel">
        <p className="empty-hint">Select a folder to view notes</p>
      </div>
    )
  }

  const filtered = activeFilter === 'all'
    ? notes
    : notes.filter((n) => n.status === activeFilter)

  const countFor = (val) => val === 'all' ? notes.length : notes.filter((n) => n.status === val).length

  return (
    <div className="note-list">
      {/* Header */}
      <div className="note-list-header">
        <span className="note-list-count">
          {filtered.length === notes.length
            ? `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`
            : `${filtered.length} / ${notes.length}`}
        </span>
        <button className="icon-btn accent" onClick={onCreateNote} title="New note">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        {FILTERS.map((f) => {
          const count = countFor(f.value)
          const color = f.value !== 'all' ? STATUS_CONFIG[f.value].color : null
          const isActive = activeFilter === f.value
          return (
            <button
              key={f.value}
              className={`filter-pill ${isActive ? 'active' : ''}`}
              style={isActive && color ? { borderColor: color, color } : {}}
              onClick={() => setActiveFilter(f.value)}
              title={`Show ${f.label.toLowerCase()} notes`}
            >
              {f.label}
              <span className="filter-pill-count">{count}</span>
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="note-list-body">
        {notes.length === 0 ? (
          <p className="empty-hint">No notes yet.<br />Press + to create one.</p>
        ) : filtered.length === 0 ? (
          <p className="empty-hint">No {STATUS_CONFIG[activeFilter]?.label.toLowerCase()} notes.</p>
        ) : (
          filtered.map((note) => (
            <NoteItem
              key={note.filePath}
              note={note}
              isSelected={selectedNote?.filePath === note.filePath}
              onSelect={onSelectNote}
              onDelete={onDeleteNote}
            />
          ))
        )}
      </div>
    </div>
  )
}
