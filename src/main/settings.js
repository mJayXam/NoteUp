import { join } from 'path'
import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

const SETTINGS_DIR = app.getPath('userData')
const SETTINGS_PATH = join(SETTINGS_DIR, 'settings.json')

function readSettings() {
  if (!existsSync(SETTINGS_PATH)) return {}
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

function writeSettings(data) {
  if (!existsSync(SETTINGS_DIR)) {
    mkdirSync(SETTINGS_DIR, { recursive: true })
  }
  writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export function getSetting(key) {
  return readSettings()[key] ?? null
}

export function setSetting(key, value) {
  const settings = readSettings()
  settings[key] = value
  writeSettings(settings)
}
