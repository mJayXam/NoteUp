import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  renameSync,
  rmSync
} from 'fs'
import { join, basename, dirname } from 'path'
import { randomUUID } from 'crypto'

// ── Folder tree ──────────────────────────────────────────────────────────────

export function getFolderTree(rootPath) {
  if (!existsSync(rootPath)) {
    mkdirSync(rootPath, { recursive: true })
  }
  return buildTree(rootPath)
}

function buildTree(folderPath) {
  const name = basename(folderPath)
  const children = []
  let noteCount = 0

  try {
    const entries = readdirSync(folderPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        children.push(buildTree(join(folderPath, entry.name)))
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        noteCount++
      }
    }
  } catch {
    // ignore permission errors
  }

  children.sort((a, b) => a.name.localeCompare(b.name))
  return { name, path: folderPath, children, noteCount }
}

// ── Notes ────────────────────────────────────────────────────────────────────

export function getNotesInFolder(folderPath) {
  if (!existsSync(folderPath)) return []

  const notes = []
  try {
    const entries = readdirSync(folderPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const filePath = join(folderPath, entry.name)
        try {
          const data = JSON.parse(readFileSync(filePath, 'utf-8'))
          notes.push({ ...data, filePath })
        } catch {
          // skip malformed files
        }
      }
    }
  } catch {
    // ignore
  }

  return notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export function getNote(filePath) {
  const data = JSON.parse(readFileSync(filePath, 'utf-8'))
  return { ...data, filePath }
}

export function createNote({ folderPath, title, content = '', status = 'open' }) {
  if (!existsSync(folderPath)) {
    mkdirSync(folderPath, { recursive: true })
  }

  const id = randomUUID()
  const now = new Date().toISOString()
  const note = {
    id,
    title: title || 'Untitled',
    content,
    status,
    createdAt: now,
    updatedAt: now
  }

  const filePath = join(folderPath, `${id}.json`)
  writeFileSync(filePath, JSON.stringify(note, null, 2), 'utf-8')
  return { ...note, filePath }
}

export function updateNote({ filePath, title, content, status }) {
  const existing = JSON.parse(readFileSync(filePath, 'utf-8'))
  const updated = {
    ...existing,
    ...(title !== undefined && { title }),
    ...(content !== undefined && { content }),
    ...(status !== undefined && { status }),
    updatedAt: new Date().toISOString()
  }
  writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8')
  return { ...updated, filePath }
}

export function deleteNote(filePath) {
  if (existsSync(filePath)) {
    unlinkSync(filePath)
  }
}

// ── Folders ──────────────────────────────────────────────────────────────────

export function createFolder({ parentPath, name }) {
  const folderPath = join(parentPath, name)
  mkdirSync(folderPath, { recursive: true })
  return { path: folderPath, name }
}

export function renameFolder({ folderPath, newName }) {
  const newPath = join(dirname(folderPath), newName)
  renameSync(folderPath, newPath)
  return { newPath }
}

export function deleteFolder(folderPath) {
  rmSync(folderPath, { recursive: true, force: true })
}
