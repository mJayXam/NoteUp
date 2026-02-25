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

function NoteItem({
  note, isSelected, isDraggable, isDragging, isDragOver,
  onSelect, onDelete, onDoubleClick,
  onDragStart, onDragOver, onDrop, onDragEnd
}) {
  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm('Delete this note?')) {
      onDelete({ folderPath: note.folderPath, noteId: note.id })
    }
  }

  const date = note.updatedAt
    ? new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  return (
    <div
      className={`note-item${isSelected ? ' selected' : ''}${isDragOver ? ' drag-over' : ''}${isDragging ? ' dragging' : ''}`}
      draggable={isDraggable}
      onDragStart={isDraggable ? onDragStart : undefined}
      onDragOver={isDraggable ? onDragOver : undefined}
      onDrop={isDraggable ? onDrop : undefined}
      onDragEnd={isDraggable ? onDragEnd : undefined}
      onClick={() => onSelect(note)}
      onDoubleClick={() => onDoubleClick(note)}
    >
      {isDraggable && (
        <svg className="drag-handle" width="10" height="14" viewBox="0 0 10 14" aria-hidden="true">
          <circle cx="3" cy="2.5"  r="1.5" fill="currentColor" />
          <circle cx="7" cy="2.5"  r="1.5" fill="currentColor" />
          <circle cx="3" cy="7"    r="1.5" fill="currentColor" />
          <circle cx="7" cy="7"    r="1.5" fill="currentColor" />
          <circle cx="3" cy="11.5" r="1.5" fill="currentColor" />
          <circle cx="7" cy="11.5" r="1.5" fill="currentColor" />
        </svg>
      )}
      <div className="note-item-content">
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
    </div>
  )
}

export default function NoteList({
  notes,
  selectedNote,
  folderPath,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onReorderNotes,
  onDoubleClickNote
}) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [dragSrcId, setDragSrcId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const canDrag = activeFilter === 'all'

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

  const handleDragStart = (e, noteId) => {
    setDragSrcId(noteId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, noteId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (noteId !== dragSrcId) setDragOverId(noteId)
  }

  const handleDrop = (e, noteId) => {
    e.preventDefault()
    if (!dragSrcId || dragSrcId === noteId) {
      setDragSrcId(null)
      setDragOverId(null)
      return
    }
    const srcIdx = notes.findIndex((n) => n.id === dragSrcId)
    const dstIdx = notes.findIndex((n) => n.id === noteId)
    const reordered = [...notes]
    const [moved] = reordered.splice(srcIdx, 1)
    reordered.splice(dstIdx, 0, moved)
    onReorderNotes(reordered.map((n) => n.id))
    setDragSrcId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDragSrcId(null)
    setDragOverId(null)
  }

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
              key={note.id}
              note={note}
              isSelected={selectedNote?.id === note.id}
              isDraggable={canDrag}
              isDragging={dragSrcId === note.id}
              isDragOver={dragOverId === note.id}
              onSelect={onSelectNote}
              onDelete={onDeleteNote}
              onDoubleClick={onDoubleClickNote}
              onDragStart={(e) => handleDragStart(e, note.id)}
              onDragOver={(e) => handleDragOver(e, note.id)}
              onDrop={(e) => handleDrop(e, note.id)}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </div>
    </div>
  )
}
