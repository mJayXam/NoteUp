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
    getNote: (filePath) => ipcRenderer.invoke('fs:getNote', filePath),
    createNote: (args) => ipcRenderer.invoke('fs:createNote', args),
    updateNote: (args) => ipcRenderer.invoke('fs:updateNote', args),
    deleteNote: (filePath) => ipcRenderer.invoke('fs:deleteNote', filePath),
    createFolder: (args) => ipcRenderer.invoke('fs:createFolder', args),
    renameFolder: (args) => ipcRenderer.invoke('fs:renameFolder', args),
    deleteFolder: (folderPath) => ipcRenderer.invoke('fs:deleteFolder', folderPath)
  },
  floatingWindow: {
    open: (filePath) => ipcRenderer.invoke('floatingWindow:open', filePath),
    setAlwaysOnTop: (value) => ipcRenderer.invoke('floatingWindow:setAlwaysOnTop', value),
    noteSaved: (filePath) => ipcRenderer.invoke('floatingWindow:noteSaved', filePath),
  },
  onNoteUpdated: (cb) => {
    const wrapped = (_, filePath) => cb(filePath)
    ipcRenderer.on('note:updated', wrapped)
    return () => ipcRenderer.removeListener('note:updated', wrapped)
  }
})
