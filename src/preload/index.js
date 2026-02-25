import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value)
  },
  dialog: {
    openFolder: () => ipcRenderer.invoke('dialog:openFolder')
  },
  fs: {
    getFolderTree: (rootPath) => ipcRenderer.invoke('fs:getFolderTree', rootPath),
    getNotes: (folderPath) => ipcRenderer.invoke('fs:getNotes', folderPath),
    getNote: (folderPath, noteId) => ipcRenderer.invoke('fs:getNote', folderPath, noteId),
    createNote: (args) => ipcRenderer.invoke('fs:createNote', args),
    updateNote: (args) => ipcRenderer.invoke('fs:updateNote', args),
    deleteNote: (args) => ipcRenderer.invoke('fs:deleteNote', args),
    createFolder: (args) => ipcRenderer.invoke('fs:createFolder', args),
    renameFolder: (args) => ipcRenderer.invoke('fs:renameFolder', args),
    deleteFolder: (folderPath) => ipcRenderer.invoke('fs:deleteFolder', folderPath)
  },
  floatingWindow: {
    open: ({ folderPath, noteId }) => ipcRenderer.invoke('floatingWindow:open', { folderPath, noteId }),
    setAlwaysOnTop: (value) => ipcRenderer.invoke('floatingWindow:setAlwaysOnTop', value),
    noteSaved: ({ folderPath, noteId }) => ipcRenderer.invoke('floatingWindow:noteSaved', { folderPath, noteId }),
  },
  onNoteUpdated: (cb) => {
    const wrapped = (_, payload) => cb(payload)
    ipcRenderer.on('note:updated', wrapped)
    return () => ipcRenderer.removeListener('note:updated', wrapped)
  }
})
