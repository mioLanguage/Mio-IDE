import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('mio', {
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (payload: { path?: string; content: string }) => ipcRenderer.invoke('file:save', payload),
  execute: (payload: { action: 'compile' | 'run' | 'compile-run'; file: string; compileCommand: string; runCommand: string }) => ipcRenderer.invoke('code:execute', payload),
  stop: () => ipcRenderer.invoke('code:stop'),
  onMenuCommand: (callback: (command: 'open' | 'save') => void) => {
    const listener = (_event: Electron.IpcRendererEvent, command: 'open' | 'save') => callback(command)
    ipcRenderer.on('menu:command', listener)
    return () => ipcRenderer.removeListener('menu:command', listener)
  },
  onOutput: (callback: (data: { stream: 'stdout' | 'stderr'; text: string }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: { stream: 'stdout' | 'stderr'; text: string }) => callback(data)
    ipcRenderer.on('code:output', listener)
    return () => ipcRenderer.removeListener('code:output', listener)
  }
})
