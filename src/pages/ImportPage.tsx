import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore, type ImportedBank } from '../store/useAppStore'
import {
  detectFormat,
  normalizeId,
  parseImportCsv,
  parseImportJson,
  type ImportIssue,
  type ParseResult,
} from '../lib/importer'
import { looksLikeExportPackage, parseExportPackage } from '../lib/exporter'
import { Badge, EmptyState } from '../components/ui/primitives'
import { ArrowRight, BookOpen, CircleCheck, CircleX, Library, Upload } from '../components/ui/icons'

type Step = 'input' | 'review' | 'done'

function issueKey(issue: ImportIssue, index: number): string {
  return `${issue.line}-${issue.field}-${index}`
}

export function ImportPage() {
  const addBank = useAppStore((state) => state.addBank)
  const existingCount = useAppStore((state) => state.banks.length)
  const [step, setStep] = useState<Step>('input')
  const [rawText, setRawText] = useState('')
  const [result, setResult] = useState<ParseResult | null>(null)
  const [error, setError] = useState('')
  const [savedId, setSavedId] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const runParse = (text: string, name: string) => {
    setError('')
    setResult(null)
    if (looksLikeExportPackage(text)) {
      const pkg = parseExportPackage(text)
      if (pkg.bank) {
        const issues: ImportIssue[] = []
        const parsed: ParseResult = {
          bank: {
            title: pkg.bank.title,
            subtitle: pkg.bank.subtitle,
            description: pkg.bank.description,
            exam: pkg.bank.exam,
            icon: pkg.bank.icon,
            accent: pkg.bank.accent,
            level: pkg.bank.level,
            durationMin: pkg.bank.durationMin,
            tags: pkg.bank.tags,
            questions: pkg.bank.questions,
          },
          issues,
          questionCount: pkg.bank.questions.length,
        }
        setResult(parsed)
        setStep('review')
        return
      }
      setError(pkg.error)
      return
    }
    const format = detectFormat(name)
    if (!format) {
      setError('仅支持 .json / .csv 文件或题屿题库包（.tiyu.json）')
      return
    }
    if (text.trim().length === 0) {
      setError('文件内容为空')
      return
    }
    const parsed = format === 'json' ? parseImportJson(text) : parseImportCsv(text)
    setResult(parsed)
    if (parsed.bank) {
      setStep('review')
    }
  }

  const onFile = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      setRawText(text)
      runParse(text, file.name)
    }
    reader.onerror = () => setError('读取文件失败，请重试')
    reader.readAsText(file, 'utf-8')
  }

  const onPaste = () => {
    runParse(rawText, '粘贴内容.json')
  }

  const commit = () => {
    if (!result?.bank) return
    const now = Date.now()
    const bank: ImportedBank = {
      id: normalizeId(result.bank.title, now),
      title: result.bank.title,
      subtitle: result.bank.subtitle,
      description: result.bank.description,
      exam: result.bank.exam,
      icon: result.bank.icon,
      accent: result.bank.accent,
      level: result.bank.level,
      durationMin: result.bank.durationMin,
      tags: result.bank.tags,
      importedAt: now,
      questions: result.bank.questions,
    }
    addBank(bank)
    setSavedId(bank.id)
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="import-page">
        <header className="page-head">
          <span className="eyebrow">导入题库</span>
          <h1 className="page-title serif">导入完成</h1>
        </header>
        <EmptyState
          icon={<CircleCheck />}
          title={`已导入 ${result?.questionCount ?? 0} 题`}
          description="题库已保存到本机浏览器，可随时在「我的题库」中练习或删除。"
          action={
            <div className="empty-action-row">
              <Link to={`/collection/${savedId}`} className="button button-primary">
                打开这个题库 <ArrowRight />
              </Link>
              <Link to="/library" className="button button-ghost">
                <Library /> 我的题库
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  if (step === 'review' && result?.bank) {
    const blocking = result.issues.filter((issue) => !issue.message.includes('跳过'))
    return (
      <div className="import-page">
        <header className="page-head">
          <span className="eyebrow">导入题库 · 确认</span>
          <h1 className="page-title serif">{result.bank.title}</h1>
          <p className="page-sub">
            共 {result.questionCount} 题
            {result.issues.length > 0 ? ` · ${result.issues.length} 条提示` : ' · 全部通过校验'}
          </p>
        </header>

        <section className="import-summary">
          <div className="import-summary-card">
            <span>题型分布</span>
            <strong className="mono">
              单选 {result.bank.questions.filter((q) => q.type === 'single').length} · 多选{' '}
              {result.bank.questions.filter((q) => q.type === 'multiple').length} · 判断{' '}
              {result.bank.questions.filter((q) => q.type === 'judge').length}
            </strong>
          </div>
          <div className="import-summary-card">
            <span>题库属性</span>
            <strong>
              <Badge tone="accent">{result.bank.exam}</Badge> <Badge tone="neutral">{result.bank.level}</Badge>
            </strong>
          </div>
        </section>

        {result.issues.length > 0 ? (
          <section className="import-issues">
            <h2 className="serif">校验提示（这些行未导入或已自动修正）</h2>
            <ul>
              {result.issues.map((issue, index) => (
                <li key={issueKey(issue, index)}>
                  <CircleX />
                  <span className="mono">第 {issue.line} 行</span>
                  <span className="import-issue-field">{issue.field}</span>
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
            {blocking.length === result.issues.length && result.questionCount === 0 ? null : null}
          </section>
        ) : (
          <div className="import-all-pass">
            <CircleCheck /> 全部题目通过校验
          </div>
        )}

        <div className="import-actions">
          <button className="button button-ghost" onClick={() => setStep('input')}>
            返回修改
          </button>
          <button className="button button-primary" onClick={commit} disabled={result.questionCount === 0}>
            确认导入 {result.questionCount} 题 <ArrowRight />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="import-page">
      <header className="page-head">
        <span className="eyebrow">导入题库</span>
        <h1 className="page-title serif">把你自己的题目带进来</h1>
        <p className="page-sub">
          支持 JSON 与 CSV 两种格式，逐行校验后才会入库。数据只保存在本机浏览器。
          {existingCount > 0 ? ` 已有 ${existingCount} 个导入题库。` : ''}
        </p>
      </header>

      <section className="import-drop">
        <div
          className="import-drop-zone"
          role="button"
          tabIndex={0}
          aria-label="选择或拖入题库文件"
          onClick={() => fileRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') fileRef.current?.click()
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            onFile(event.dataTransfer.files?.[0])
          }}
        >
          <Upload />
          <strong>点击选择，或把 .json / .csv 文件拖到这里</strong>
          <span>单次最多 2000 题，超过 2 个选项请用 JSON 格式</span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv,.tiyu.json,text/csv,application/json"
          className="visually-hidden"
          onChange={(event) => onFile(event.target.files?.[0] ?? undefined)}
        />
        {error ? (
          <p className="import-error" role="alert">
            <CircleX /> {error}
          </p>
        ) : null}
      </section>

      <section className="import-paste">
        <div className="section-head">
          <h2 className="section-title serif">或者直接粘贴 JSON</h2>
          <Link to="/docs" className="text-link" onClick={(event) => event.preventDefault()}>
            格式说明见 docs/IMPORT_FORMAT.md
          </Link>
        </div>
        <textarea
          className="import-textarea mono"
          rows={10}
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder={'{\n  "title": "我的题库",\n  "questions": [\n    {\n      "type": "single",\n      "stem": "题干",\n      "options": ["选项A", "选项B", "选项C", "选项D"],\n      "answer": ["A"],\n      "explanation": "解析"\n    }\n  ]\n}'}
          aria-label="粘贴 JSON 内容"
        />
        <div className="import-actions">
          <button className="button button-ghost" onClick={() => setRawText('')} disabled={!rawText}>
            清空
          </button>
          <button className="button button-primary" onClick={onPaste} disabled={!rawText.trim()}>
            <BookOpen /> 校验并预览
          </button>
        </div>
      </section>
    </div>
  )
}

export function ImportPageIntro() {
  return (
    <Link to="/import" className="import-entry">
      <Upload /> 导入我的题库
    </Link>
  )
}
