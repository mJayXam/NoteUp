import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import FloatingNoteView from './components/FloatingNoteView'
import './styles/index.css'

const params = new URLSearchParams(window.location.search)
const isFloating = params.get('floating') === '1'
const floatingFolderPath = params.get('folderPath')
const floatingNoteId = params.get('noteId')

ReactDOM.createRoot(document.getElementById('root')).render(
  isFloating
    ? <FloatingNoteView folderPath={floatingFolderPath} noteId={floatingNoteId} />
    : <React.StrictMode><App /></React.StrictMode>
)
