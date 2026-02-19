import React from 'react'

const STATUS_CONFIG = {
  open: { label: 'Open', color: '#e05252' },
  'in-progress': { label: 'In Progress', color: '#d4a017' },
  done: { label: 'Done', color: '#3fad72' }
}

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
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
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
  if (!folderPath) {
    return (
      <div className="note-list empty-panel">
        <p className="empty-hint">Select a folder to view notes</p>
      </div>
    )
  }

  return (
    <div className="note-list">
      <div className="note-list-header">
        <span className="note-list-count">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </span>
        <button className="icon-btn accent" onClick={onCreateNote} title="New note">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="note-list-body">
        {notes.length === 0 ? (
          <p className="empty-hint">No notes yet.<br />Press + to create one.</p>
        ) : (
          notes.map((note) => (
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
