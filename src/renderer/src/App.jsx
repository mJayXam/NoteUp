import React, { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import NoteList from './components/NoteList'
import NoteEditor from './components/NoteEditor'
import Settings from './components/Settings'

export default function App() {
  const [rootPath, setRootPath] = useState(null)
  const [folderTree, setFolderTree] = useState(null)
  const [selectedFolderPath, setSelectedFolderPath] = useState(null)
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load root path from settings on startup
  useEffect(() => {
    window.api.settings.get('rootPath').then((path) => {
      if (path) {
        setRootPath(path)
      } else {
        setLoading(false)
        setShowSettings(true)
      }
    })
  }, [])

  // Load folder tree when rootPath changes
  const refreshFolderTree = useCallback(async () => {
    if (!rootPath) return
    const tree = await window.api.fs.getFolderTree(rootPath)
    setFolderTree(tree)
    setLoading(false)
  }, [rootPath])

  useEffect(() => {
    if (rootPath) refreshFolderTree()
  }, [rootPath, refreshFolderTree])

  // Load notes when selected folder changes
  const refreshNotes = useCallback(async () => {
    if (!selectedFolderPath) {
      setNotes([])
      return
    }
    const list = await window.api.fs.getNotes(selectedFolderPath)
    setNotes(list)
  }, [selectedFolderPath])

  useEffect(() => {
    refreshNotes()
  }, [selectedFolderPath, refreshNotes])

  // ── Folder actions ─────────────────────────────────────────────────────────

  const handleSelectFolder = (path) => {
    setSelectedFolderPath(path)
    setSelectedNote(null)
  }

  const handleCreateFolder = async (parentPath, name) => {
    await window.api.fs.createFolder({ parentPath, name })
    await refreshFolderTree()
  }

  const handleRenameFolder = async (folderPath, newName) => {
    await window.api.fs.renameFolder({ folderPath, newName })
    if (selectedFolderPath === folderPath || selectedFolderPath?.startsWith(folderPath)) {
      setSelectedFolderPath(null)
      setSelectedNote(null)
    }
    await refreshFolderTree()
  }

  const handleDeleteFolder = async (folderPath) => {
    await window.api.fs.deleteFolder(folderPath)
    if (selectedFolderPath === folderPath || selectedFolderPath?.startsWith(folderPath)) {
      setSelectedFolderPath(null)
      setSelectedNote(null)
    }
    await refreshFolderTree()
  }

  // ── Note actions ───────────────────────────────────────────────────────────

  const handleSelectNote = async (note) => {
    const full = await window.api.fs.getNote(note.filePath)
    setSelectedNote(full)
  }

  const handleCreateNote = async () => {
    if (!selectedFolderPath) return
    const note = await window.api.fs.createNote({
      folderPath: selectedFolderPath,
      title: 'Untitled Note',
      content: '',
      status: 'open'
    })
    await refreshNotes()
    setSelectedNote(note)
  }

  const handleDeleteNote = async (filePath) => {
    await window.api.fs.deleteNote(filePath)
    if (selectedNote?.filePath === filePath) setSelectedNote(null)
    await refreshNotes()
    await refreshFolderTree()
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  const handleSaveRootPath = async (newPath) => {
    await window.api.settings.set('rootPath', newPath)
    setSelectedFolderPath(null)
    setSelectedNote(null)
    setFolderTree(null)
    setNotes([])
    setRootPath(newPath)
    setShowSettings(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-text">Loading...</div>
      </div>
    )
  }

  if (showSettings || !rootPath) {
    return (
      <Settings
        currentPath={rootPath}
        onSave={handleSaveRootPath}
        onCancel={rootPath ? () => setShowSettings(false) : null}
      />
    )
  }

  return (
    <div className="app">
      <div className="panel panel-sidebar">
        <Sidebar
          tree={folderTree}
          rootPath={rootPath}
          selectedFolderPath={selectedFolderPath}
          onSelectFolder={handleSelectFolder}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onOpenSettings={() => setShowSettings(true)}
        />
      </div>

      <div className="panel panel-list">
        <NoteList
          notes={notes}
          selectedNote={selectedNote}
          folderPath={selectedFolderPath}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
        />
      </div>

      <div className="panel panel-editor">
        <NoteEditor
          note={selectedNote}
          onNoteUpdated={async () => {
            await refreshNotes()
            await refreshFolderTree()
          }}
        />
      </div>
    </div>
  )
}
