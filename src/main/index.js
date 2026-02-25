import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'

const iconPath = app.isPackaged
  ? join(process.resourcesPath, 'Note.png')
  : join(__dirname, '../../src/assets/Note.png')
import { getSetting, setSetting } from './settings.js'
import {
  getFolderTree,
  getNotesInFolder,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  reorderNotes,
  createFolder,
  renameFolder,
  deleteFolder
} from './fileSystem.js'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1a1a2e',
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    show: false
  })

  win.once('ready-to-show', () => win.show())

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── Settings ─────────────────────────────────────────────────────────────────

ipcMain.handle('settings:get', (_, key) => getSetting(key))
ipcMain.handle('settings:set', (_, key, value) => setSetting(key, value))

// ── Dialog ───────────────────────────────────────────────────────────────────

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
})

// ── File system ───────────────────────────────────────────────────────────────

ipcMain.handle('fs:getFolderTree', (_, rootPath) => getFolderTree(rootPath))
ipcMain.handle('fs:getNotes', (_, folderPath) => getNotesInFolder(folderPath))
ipcMain.handle('fs:getNote', (_, folderPath, noteId) => getNote(folderPath, noteId))
ipcMain.handle('fs:createNote', (_, args) => createNote(args))
ipcMain.handle('fs:updateNote', (_, args) => updateNote(args))
ipcMain.handle('fs:deleteNote', (_, args) => deleteNote(args))
ipcMain.handle('fs:reorderNotes', (_, args) => reorderNotes(args))
ipcMain.handle('fs:createFolder', (_, args) => createFolder(args))
ipcMain.handle('fs:renameFolder', (_, args) => renameFolder(args))
ipcMain.handle('fs:deleteFolder', (_, folderPath) => deleteFolder(folderPath))

// ── Floating window ───────────────────────────────────────────────────────────

const floatingWindows = new Map() // `${folderPath}::${noteId}` → BrowserWindow

ipcMain.handle('floatingWindow:open', async (_, { folderPath, noteId }) => {
  const key = `${folderPath}::${noteId}`
  const existing = floatingWindows.get(key)
  if (existing && !existing.isDestroyed()) {
    if (existing.isMinimized()) existing.restore()
    existing.focus()
    return
  }

  const floatWin = new BrowserWindow({
    width: 520,
    height: 620,
    minWidth: 360,
    minHeight: 300,
    title: 'NoteUp – Note',
    backgroundColor: '#1a1a2e',
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })
  floatingWindows.set(key, floatWin)
  floatWin.on('closed', () => floatingWindows.delete(key))

  const encodedFolder = encodeURIComponent(folderPath)
  if (process.env['ELECTRON_RENDERER_URL']) {
    floatWin.loadURL(
      `${process.env['ELECTRON_RENDERER_URL']}?floating=1&folderPath=${encodedFolder}&noteId=${encodeURIComponent(noteId)}`
    )
  } else {
    floatWin.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { floating: '1', folderPath, noteId },
    })
  }
})

ipcMain.handle('floatingWindow:setAlwaysOnTop', (event, value) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.setAlwaysOnTop(value)
})

ipcMain.handle('floatingWindow:noteSaved', (event, { folderPath, noteId }) => {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win.webContents !== event.sender) {
      win.webContents.send('note:updated', { folderPath, noteId })
    }
  })
})
