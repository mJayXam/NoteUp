import React, { useState, useEffect, useRef } from 'react'

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconFolder() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M1 3a1 1 0 011-1h3.586a1 1 0 01.707.293L7 3h5a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1V3z" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
      <path d="M7.5 5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM5.5 7.5a2 2 0 114 0 2 2 0 01-4 0z" />
      <path d="M6.2 1a.8.8 0 00-.78.63l-.22 1a5.5 5.5 0 00-.9.52l-.96-.39a.8.8 0 00-.98.32l-1.3 2.25a.8.8 0 00.18 1.02l.79.63a5.56 5.56 0 000 1.04l-.79.63a.8.8 0 00-.18 1.02l1.3 2.25a.8.8 0 00.98.32l.96-.39c.28.2.58.37.9.52l.22 1A.8.8 0 006.2 14h2.6a.8.8 0 00.78-.63l.22-1a5.5 5.5 0 00.9-.52l.96.39a.8.8 0 00.98-.32l1.3-2.25a.8.8 0 00-.18-1.02l-.79-.63a5.56 5.56 0 000-1.04l.79-.63a.8.8 0 00.18-1.02L12.64 3.1a.8.8 0 00-.98-.32l-.96.39a5.5 5.5 0 00-.9-.52l-.22-1A.8.8 0 008.8 1H6.2z" />
    </svg>
  )
}

// ── Context Menu ──────────────────────────────────────────────────────────────

function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div ref={ref} className="ctx-menu" style={{ top: y, left: x }}>
      {items.map((item, i) =>
        item === 'separator' ? (
          <div key={i} className="ctx-separator" />
        ) : (
          <button
            key={i}
            className={`ctx-item ${item.danger ? 'danger' : ''}`}
            onClick={() => { onClose(); item.onClick() }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  )
}

// ── Folder Node ───────────────────────────────────────────────────────────────

function FolderNode({ node, selectedFolderPath, onSelect, onRenameFolder, onDeleteFolder }) {
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(node.name)
  const [menu, setMenu] = useState(null)
  const isSelected = selectedFolderPath === node.path

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setMenu({ x: e.clientX, y: e.clientY })
  }

  const menuItems = [
    {
      label: 'Rename',
      onClick: () => {
        setRenaming(true)
        setNewName(node.name)
      }
    },
    'separator',
    {
      label: 'Delete Folder',
      danger: true,
      onClick: () => {
        if (window.confirm(`Delete "${node.name}" and all its notes?`)) {
          onDeleteFolder(node.path)
        }
      }
    }
  ]

  const handleRenameSubmit = (e) => {
    e?.preventDefault()
    const trimmed = newName.trim()
    if (trimmed && trimmed !== node.name) {
      onRenameFolder(node.path, trimmed)
    }
    setRenaming(false)
  }

  return (
    <div className="folder-node">
      {renaming ? (
        <form onSubmit={handleRenameSubmit} className="inline-form" style={{ paddingLeft: 8 }}>
          <input
            className="inline-input"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => e.key === 'Escape' && setRenaming(false)}
          />
        </form>
      ) : (
        <div
          className={`folder-row ${isSelected ? 'selected' : ''}`}
          onClick={() => onSelect(node.path)}
          onContextMenu={handleContextMenu}
        >
          <span className="folder-chevron" />
          <span className="folder-icon"><IconFolder /></span>
          <span className="folder-name">{node.name}</span>
          {node.noteCount > 0 && (
            <span className="folder-badge">{node.noteCount}</span>
          )}
        </div>
      )}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export default function Sidebar({
  tree,
  rootPath,
  selectedFolderPath,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onOpenSettings
}) {
  const [creatingRoot, setCreatingRoot] = useState(false)
  const [rootName, setRootName] = useState('')

  const handleCreateRoot = (e) => {
    e?.preventDefault()
    const trimmed = rootName.trim()
    if (trimmed) onCreateFolder(rootPath, trimmed)
    setCreatingRoot(false)
    setRootName('')
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">NoteUp</span>
        <button className="icon-btn" onClick={onOpenSettings} title="Settings">
          <IconSettings />
        </button>
      </div>

      <div className="sidebar-toolbar">
        <button
          className="toolbar-btn"
          onClick={() => { setCreatingRoot(true); setRootName('') }}
        >
          + New Folder
        </button>
      </div>

      {creatingRoot && (
        <form onSubmit={handleCreateRoot} className="inline-form" style={{ padding: '0 8px 4px' }}>
          <input
            className="inline-input"
            autoFocus
            placeholder="Folder name..."
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            onBlur={() => { if (!rootName.trim()) setCreatingRoot(false); else handleCreateRoot() }}
            onKeyDown={(e) => e.key === 'Escape' && setCreatingRoot(false)}
          />
        </form>
      )}

      <div className="folder-tree">
        {tree && tree.length === 0 && (
          <p className="empty-hint" style={{ padding: '12px 16px', fontSize: '12px' }}>
            No folders yet.<br />Press + New Folder to create one.
          </p>
        )}
        {tree && tree.map((node) => (
          <FolderNode
            key={node.path}
            node={node}
            selectedFolderPath={selectedFolderPath}
            onSelect={onSelectFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
          />
        ))}
      </div>
    </div>
  )
}
