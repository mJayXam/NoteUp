import React, { useState } from 'react'

export default function Settings({ currentPath, onSave, onCancel }) {
  const [path, setPath] = useState(currentPath ?? '')

  const handleBrowse = async () => {
    const selected = await window.api.dialog.openFolder()
    if (selected) setPath(selected)
  }

  const handleSave = () => {
    const trimmed = path.trim()
    if (trimmed) onSave(trimmed)
  }

  return (
    <div className="settings-backdrop">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
        </div>

        <div className="settings-body">
          <label className="settings-label">Notes Folder</label>
          <p className="settings-desc">
            All notes will be stored as JSON files inside this folder. Subfolders become
            categories in the sidebar.
          </p>
          <div className="path-row">
            <input
              className="path-input"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="e.g. C:\Users\you\Documents\Notes"
              readOnly
            />
            <button className="browse-btn" onClick={handleBrowse}>
              Browse...
            </button>
          </div>
          {path && (
            <p className="path-preview">{path}</p>
          )}
        </div>

        <div className="settings-footer">
          {onCancel && (
            <button className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button className="btn-primary" onClick={handleSave} disabled={!path.trim()}>
            {currentPath ? 'Save' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  )
}
