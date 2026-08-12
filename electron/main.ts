import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron'
import { spawn, ChildProcess, execSync } from 'node:child_process'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

let window: BrowserWindow | null = null
let running: ChildProcess | null = null
const isDev = !app.isPackaged

function createWindow() {
  window = new BrowserWindow({ width: 1360, height: 860, minWidth: 960, minHeight: 640, backgroundColor: '#101316', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } })
  if (isDev) window.loadURL('http://localhost:5173')
  else window.loadFile(path.join(__dirname, '../dist/index.html'))
  window.on('closed', () => { window = null })
}

function sendOutput(stream: 'stdout' | 'stderr', text: string) { window?.webContents.send('code:output', { stream, text }) }

function decodeOutput(buffer: Buffer): string {
  if (os.platform() === 'win32') {
    try {
      return buffer.toString('gbk' as BufferEncoding)
    } catch {
      return buffer.toString('utf8')
    }
  }
  return buffer.toString('utf8')
}

function getPowerShellPath(): string {
  const systemRoot = process.env.SystemRoot || 'C:\\Windows'
  const candidates = [
    path.join(systemRoot, 'System32\\WindowsPowerShell\\v1.0\\powershell.exe'),
    path.join(systemRoot, 'SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe'),
    'powershell.exe',
    'pwsh.exe'
  ]
  try {
    const found = execSync('where powershell.exe', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    if (found) return found.split(/\r?\n/)[0]
  } catch {
    // ignore and fallback
  }
  try {
    const found = execSync('where pwsh.exe', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    if (found) return found.split(/\r?\n/)[0]
  } catch {
    // ignore and fallback
  }
  return candidates[0]
}

function expandCommand(command: string, file: string) {
  const parsed = path.parse(file)
  const values: Record<string, string> = {
    file,
    fileName: parsed.base,
    fileBase: parsed.name,
    dir: parsed.dir,
    output: path.join(parsed.dir, `${parsed.name}${process.platform === 'win32' ? '.exe' : ''}`)
  }
  return command.replace(/\$\{(file|fileName|fileBase|dir|output)\}/g, (_match, key: string) => values[key])
}

function executeCommand(command: string, file: string, openInNewWindow = false) {
  return new Promise<number>((resolve) => {
    const expanded = expandCommand(command, file)
    sendOutput('stdout', `$ ${expanded}\n`)
    const env = { ...process.env }
    if (os.platform() === 'win32') {
      const pathSegments = (env.PATH || '').split(';')
      if (!pathSegments.includes('D:\\mio-exe\\bin')) pathSegments.push('D:\\mio-exe\\bin')
      env.PATH = pathSegments.join(';')
    }
    const cwd = path.dirname(file)
    if (os.platform() === 'win32') {
      if (openInNewWindow) {
        // 新开一个 cmd 窗口运行程序，输出显示在独立窗口
        const shell = getPowerShellPath()
        const startCmd = `Start-Process cmd -ArgumentList '/k', '${expanded.replace(/'/g, "''")}' -WorkingDirectory '${cwd.replace(/'/g, "''")}'`
        running = spawn(shell, ['-NoProfile', '-Command', startCmd], { cwd, windowsHide: true, env })
        running.on('error', (error) => sendOutput('stderr', `${error.message}\n`))
        running.on('close', () => { running = null; resolve(0) })
        return
      }
      const shell = getPowerShellPath()
      running = spawn(shell, ['-NoProfile', '-Command', expanded], { cwd, windowsHide: true, env })
    } else {
      running = spawn(expanded, { cwd, shell: true, env })
    }
    running.stdout?.on('data', (chunk) => sendOutput('stdout', decodeOutput(chunk)))
    running.stderr?.on('data', (chunk) => sendOutput('stderr', decodeOutput(chunk)))
    running.on('error', (error) => sendOutput('stderr', `${error.message}\n`))
    running.on('close', (code) => { running = null; resolve(code ?? 1) })
  })
}

app.whenReady().then(() => {
  createWindow()
  const sendMenuCommand = (command: 'open' | 'save') => window?.webContents.send('menu:command', command)
  const template: Electron.MenuItemConstructorOptions[] = [{ label: '文件', submenu: [{ label: '打开', accelerator: 'CmdOrCtrl+O', click: () => sendMenuCommand('open') }, { label: '保存', accelerator: 'CmdOrCtrl+S', click: () => sendMenuCommand('save') }, { type: 'separator' }, { role: 'quit' }] }, { label: '编辑', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }] }, { label: '视图', submenu: [{ role: 'toggleDevTools' }, { role: 'resetZoom' }] }]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  sendOutput('stderr', `Uncaught exception: ${error.message}\n`)
})
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
  sendOutput('stderr', `Unhandled rejection: ${reason}\n`)
})

ipcMain.handle('file:open', async () => { const result = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Mio 源文件', extensions: ['mio'] }, { name: '所有文件', extensions: ['*'] }] }); if (result.canceled || !result.filePaths[0]) return null; const filePath = result.filePaths[0]; return { path: filePath, content: await fs.readFile(filePath, 'utf8') } })
ipcMain.handle('file:save', async (_event, payload: { path?: string; content: string }) => { let filePath = payload.path; if (!filePath) { const result = await dialog.showSaveDialog({ defaultPath: 'untitled.mio', filters: [{ name: 'Mio 源文件', extensions: ['mio'] }] }); if (result.canceled || !result.filePath) return null; filePath = result.filePath } await fs.writeFile(filePath, payload.content, 'utf8'); return { path: filePath } })
ipcMain.handle('code:execute', async (_event, payload: { action: 'compile' | 'run' | 'compile-run'; file: string; compileCommand: string; runCommand: string }) => {
  if (running) return { ok: false, error: '已有任务正在执行' }
  const commands = payload.action === 'compile' ? [payload.compileCommand] : payload.action === 'run' ? [payload.runCommand] : [payload.compileCommand, payload.runCommand]
  if (commands.some((command) => !command.trim())) return { ok: false, error: '请先在设置中填写命令' }
  for (const command of commands) {
    // 运行程序时新开 cmd 窗口；编译时输出显示在 IDE 面板
    const openInNewWindow = payload.action === 'run' || (payload.action === 'compile-run' && command === payload.runCommand)
    const exitCode = await executeCommand(command, payload.file, openInNewWindow)
    if (exitCode !== 0) { sendOutput('stderr', `进程退出，代码 ${exitCode}\n`); return { ok: false, exitCode } }
  }
  sendOutput('stdout', '执行完成\n')
  return { ok: true, exitCode: 0 }
})
ipcMain.handle('code:stop', () => { if (running?.pid) { if (process.platform === 'win32') spawn('taskkill', ['/pid', String(running.pid), '/t', '/f'], { windowsHide: true }); else running.kill('SIGTERM'); running = null; sendOutput('stderr', '进程已停止\n'); return true } return false })
