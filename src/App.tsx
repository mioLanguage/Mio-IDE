import { useEffect, useRef, useState } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'
import { Play, Square, FolderOpen, Save, Plus, Sun, Moon, PanelBottom, FileCode2, ChevronDown, Settings2, Hammer, Zap, X } from 'lucide-react'
import { mioLanguage } from './mioLanguage'

type Action = 'compile' | 'run' | 'compile-run'
type Output = { stream: 'stdout' | 'stderr'; text: string }
const defaultCompile = 'mioc "${file}" -o "${output}"'
const defaultRun = 'start "" cmd /k "${output}"'

export default function App() {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView>()
  const [filePath, setFilePath] = useState<string>()
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [outputs, setOutputs] = useState<Output[]>([])
  const [outputOpen, setOutputOpen] = useState(true)
  const [running, setRunning] = useState(false)
  const [activeAction, setActiveAction] = useState<Action>()
  const [dark, setDark] = useState(true)
  const [fontSize, setFontSize] = useState(14)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [compileCommand, setCompileCommand] = useState(() => localStorage.getItem('mio.compileCommand') ?? defaultCompile)
  const [runCommand, setRunCommand] = useState(() => localStorage.getItem('mio.runCommand') ?? defaultRun)
  const dirty = content !== savedContent
  const fileName = filePath?.split('\\').pop() ?? 'untitled.mio'

  useEffect(() => {
    if (!editorRef.current) return
    const update = EditorView.updateListener.of((transaction) => {
      if (transaction.docChanged) setContent(transaction.state.doc.toString())
    })
    const state = EditorState.create({ doc: content, extensions: [lineNumbers(), highlightActiveLine(), drawSelection(), history(), bracketMatching(), indentOnInput(), keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab, { key: 'Tab', run: (view) => { const { from, to } = view.state.selection.main; view.dispatch({ changes: { from, to, insert: '    ' } }); return true } }, { key: '(', run: (view) => { const { from } = view.state.selection.main; view.dispatch({ changes: { from, to: from, insert: '()' }, selection: { anchor: from + 1, head: from + 1 } }); return true } }, { key: '[', run: (view) => { const { from } = view.state.selection.main; view.dispatch({ changes: { from, to: from, insert: '[]' }, selection: { anchor: from + 1, head: from + 1 } }); return true } }, { key: '{', run: (view) => { const { from } = view.state.selection.main; view.dispatch({ changes: { from, to: from, insert: '{}' }, selection: { anchor: from + 1, head: from + 1 } }); return true } }, { key: '"', run: (view) => { const { from } = view.state.selection.main; const next = view.state.doc.sliceString(from, from + 1); if (next === '"') { view.dispatch({ selection: { anchor: from + 1, head: from + 1 } }); return true } view.dispatch({ changes: { from, to: from, insert: '""' }, selection: { anchor: from + 1, head: from + 1 } }); return true } }, { key: "'", run: (view) => { const { from } = view.state.selection.main; const next = view.state.doc.sliceString(from, from + 1); if (next === "'") { view.dispatch({ selection: { anchor: from + 1, head: from + 1 } }); return true } view.dispatch({ changes: { from, to: from, insert: "''" }, selection: { anchor: from + 1, head: from + 1 } }); return true } }]), mioLanguage, syntaxHighlighting(defaultHighlightStyle), ...(dark ? [oneDark] : []), update] })
    const view = new EditorView({ state, parent: editorRef.current })
    viewRef.current = view
    return () => view.destroy()
  }, [dark])

  useEffect(() => window.mio.onOutput((data) => setOutputs((items) => [...items, data])), [])

  const replaceContent = (next: string, nextPath?: string) => {
    setContent(next); setSavedContent(next); setFilePath(nextPath)
    viewRef.current?.dispatch({ changes: { from: 0, to: viewRef.current.state.doc.length, insert: next } })
  }
  const open = async () => { const result = await window.mio.openFile(); if (result) replaceContent(result.content, result.path) }
  const save = async () => {
    const result = await window.mio.saveFile({ path: filePath, content })
    if (!result) return undefined
    setFilePath(result.path); setSavedContent(content)
    return result.path
  }
  useEffect(() => window.mio.onMenuCommand((command) => { if (command === 'open') void open(); else void save() }), [content, filePath])

  const execute = async (action: Action) => {
    const target = dirty || !filePath ? await save() : filePath
    if (!target) return
    setOutputs([]); setOutputOpen(true); setRunning(true); setActiveAction(action)
    const result = await window.mio.execute({ action, file: target, compileCommand, runCommand })
    if (result.error) setOutputs((items) => [...items, { stream: 'stderr', text: `${result.error}\n` }])
    setRunning(false); setActiveAction(undefined)
  }
  const saveSettings = () => {
    localStorage.setItem('mio.compileCommand', compileCommand)
    localStorage.setItem('mio.runCommand', runCommand)
    setSettingsOpen(false)
  }

  return <div className={dark ? 'app dark' : 'app'}>
    <header className="topbar"><div className="brand"><span className="brand-mark">M</span><span>Mio IDE</span></div><div className="file-title"><FileCode2 size={15}/><span>{fileName}</span>{dirty && <i>●</i>}</div><div className="top-actions"><button title="新建 Mio 文件" onClick={() => replaceContent('')}><Plus size={16}/></button><button title="打开 Mio 文件" onClick={open}><FolderOpen size={16}/></button><button title="保存 Mio 文件" onClick={save}><Save size={16}/></button><button title="命令设置" onClick={() => setSettingsOpen(true)}><Settings2 size={16}/></button><span className="divider"/><button title="编译" className="action-button" onClick={() => execute('compile')} disabled={running}><Hammer size={14}/>{activeAction === 'compile' ? '编译中' : '编译'}</button><button title="运行" className="action-button" onClick={() => execute('run')} disabled={running}><Play size={14}/>{activeAction === 'run' ? '运行中' : '运行'}</button><button title="编译并运行" className="run-button" onClick={() => execute('compile-run')} disabled={running}><Zap size={14}/>{activeAction === 'compile-run' ? '执行中' : '编译运行'}</button><button title="停止" onClick={async () => { await window.mio.stop(); setRunning(false); setActiveAction(undefined) }} disabled={!running}><Square size={14} fill="currentColor"/></button></div></header>
    <div className="workspace"><aside className="sidebar"><div className="sidebar-heading"><span>Mio 项目</span><button title="命令设置" onClick={() => setSettingsOpen(true)}><Settings2 size={15}/></button></div><div className="workspace-root"><ChevronDown size={14}/><span>MIO PROJECT</span></div><button className="file-row active"><FileCode2 size={15}/><span>{fileName}</span>{dirty && <span className="dirty-dot"/>}</button><div className="sidebar-footer"><span>Mio 语言模式</span><span className="online-dot"/></div></aside><main className="main"><div className="editor-toolbar"><div className="breadcrumbs"><span>编辑器</span><span>/</span><strong>Mio</strong></div><div className="editor-tools"><label><span>字号</span><select value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))}><option value={12}>12</option><option value={14}>14</option><option value={16}>16</option><option value={18}>18</option></select></label><button title="切换主题" onClick={() => setDark(!dark)}>{dark ? <Sun size={15}/> : <Moon size={15}/>}</button><button title="输出面板" className={outputOpen ? 'selected' : ''} onClick={() => setOutputOpen(!outputOpen)}><PanelBottom size={15}/></button></div></div><div className="editor-shell" style={{ fontSize }} ref={editorRef}/>{outputOpen && <section className="output-panel"><div className="output-header"><span>构建输出</span><span className="output-count">{outputs.length ? `${outputs.length} 条记录` : '就绪'}</span><button onClick={() => setOutputs([])}>清空</button></div><div className="output-body">{outputs.length ? outputs.map((output, index) => <pre className={output.stream} key={index}>{output.text}</pre>) : <div className="empty-output">编译和运行结果将显示在这里</div>}</div></section>}</main></div>
    <footer className="statusbar"><span>Ln {viewRef.current?.state.doc.lines ?? 1}, Col 1</span><span>UTF-8</span><span>MIO</span><span className="status-spacer"/><span>{running ? '任务执行中' : dirty ? '未保存' : '已保存'}</span></footer>
    {settingsOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false) }}><section className="settings-dialog" role="dialog" aria-modal="true" aria-label="Mio 命令设置"><header><div><strong>Mio 命令设置</strong><span>命令在当前文件目录中执行</span></div><button title="关闭" onClick={() => setSettingsOpen(false)}><X size={17}/></button></header><div className="settings-content"><label><span>编译命令</span><input value={compileCommand} onChange={(event) => setCompileCommand(event.target.value)} spellCheck={false}/></label><label><span>运行命令</span><input value={runCommand} onChange={(event) => setRunCommand(event.target.value)} spellCheck={false}/></label><div className="variables"><span>可用变量</span><code>${'{file}'}</code><code>${'{fileName}'}</code><code>${'{fileBase}'}</code><code>${'{dir}'}</code><code>${'{output}'}</code></div></div><footer><button className="secondary" onClick={() => { setCompileCommand(defaultCompile); setRunCommand(defaultRun) }}>恢复默认</button><button className="primary" onClick={saveSettings}>保存设置</button></footer></section></div>}
  </div>
}
