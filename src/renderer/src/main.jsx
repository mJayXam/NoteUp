import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import FloatingNoteView from './components/FloatingNoteView'
import './styles/index.css'

const params = new URLSearchParams(window.location.search)
const isFloating = params.get('floating') === '1'
const floatingPath = params.get('path')

ReactDOM.createRoot(document.getElementById('root')).render(
  isFloating
    ? <FloatingNoteView filePath={floatingPath} />
    : <React.StrictMode><App /></React.StrictMode>
)
