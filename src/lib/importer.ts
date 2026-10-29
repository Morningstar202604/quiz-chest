import type { Difficulty, QuestionSeed, QuestionType } from '../data/types'

export interface ImportBankInput {
  title: string
  subtitle: string
  description: string
  exam: string
  icon: string
  accent: string
  level: '入门' | '进阶' | '挑战'
  durationMin: number
  tags: string[]
  questions: ImportQuestionInput[]
}

export interface ImportQuestionInput {
  type: QuestionType
  stem: string
  options: string[]
  answer: number[]
  explanation: string
  difficulty: Difficulty
  tags: string[]
}

export interface ImportIssue {
  line: number
  field: string
  message: string
}

export interface ParseResult {
  bank: ImportBankInput | null
  issues: ImportIssue[]
  questionCount: number
}

const QUESTION_TYPES: QuestionType[] = ['single', 'multiple', 'judge']
const LEVELS = ['入门', '进阶', '挑战'] as const
const ACCENTS = [
  '#315B7D', '#B45309', '#6E4B8A', '#1F7A5C', '#3E4C59', '#9A3B32', '#7A5C2E',
]

const HEADERS = [
  'stem', 'optionA', 'optionB', 'optionC', 'optionD', 'optionE', 'optionF',
  'answer', 'explanation', 'type', 'difficulty', 'tags',
] as const

const OPTION_KEYS = ['optionA', 'optionB', 'optionC', 'optionD', 'optionE', 'optionF'] as const

export function normalizeId(rawTitle: string, salt: number): string {
  const slug = rawTitle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, (match) => {
      let encoded = ''
      for (const ch of new TextEncoder().encode(match)) encoded += ch.toString(36)
      return encoded
    })
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const safe = slug.length > 0 ? slug : 'bank'
  return `${safe}-${salt.toString(36)}`
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function parseAnswer(raw: unknown, optionCount: number, line: number, issues: ImportIssue[]): number[] {
  const text = asString(raw).toUpperCase().replace(/\s+/g, '')
  if (!text) {
    issues.push({ line, field: 'answer', message: '缺少答案' })
    return []
  }
  const indexes: number[] = []
  for (const char of text) {
    const index = char.charCodeAt(0) - 65
    if (index < 0 || index >= optionCount) {
      issues.push({ line, field: 'answer', message: `答案 ${char} 超出选项范围（A-${String.fromCharCode(64 + optionCount)}）` })
      return []
    }
    if (!indexes.includes(index)) indexes.push(index)
  }
  return indexes.sort((a, b) => a - b)
}

function normalizeQuestionRow(raw: unknown, line: number, issues: ImportIssue[]): ImportQuestionInput | null {
  if (typeof raw !== 'object' || raw === null) {
    issues.push({ line, field: 'row', message: '题目必须是对象' })
    return null
  }
  const item = raw as Record<string, unknown>
  let row = item
  if (Array.isArray(item.options)) {
    const normalized: Record<string, unknown> = { ...item }
    item.options.slice(0, 6).forEach((value, index) => {
      normalized[OPTION_KEYS[index]] = value
    })
    delete normalized.options
    row = normalized
  }
  return seedFromRow(row, line, issues)
}

function seedFromRow(row: Record<string, unknown>, line: number, issues: ImportIssue[]): ImportQuestionInput | null {
  const stem = asString(row.stem)
  if (!stem) {
    issues.push({ line, field: 'stem', message: '缺少题干' })
    return null
  }
  const options: string[] = []
  for (const key of OPTION_KEYS) {
    const value = asString(Object.prototype.hasOwnProperty.call(row, key) ? row[key] : undefined)
    if (value) options.push(value)
  }
  if (options.length < 2) {
    issues.push({ line, field: 'options', message: '选项少于 2 个' })
    return null
  }
  const typeRaw = asString(row.type).toLowerCase() || 'single'
  if (!QUESTION_TYPES.includes(typeRaw as QuestionType)) {
    issues.push({ line, field: 'type', message: `题型 ${row.type as string} 不合法（single/multiple/judge）` })
    return null
  }
  const type = typeRaw as QuestionType
  const answer = parseAnswer(row.answer, options.length, line, issues)
  if (answer.length === 0) return null
  if (type !== 'multiple' && answer.length > 1) {
    issues.push({ line, field: 'answer', message: `${type} 题型只能有一个答案` })
    return null
  }
  if (type === 'judge' && options.length !== 2) {
    issues.push({ line, field: 'options', message: '判断题必须恰好 2 个选项' })
    return null
  }
  const explanation = asString(row.explanation)
  if (explanation.length < 4) {
    issues.push({ line, field: 'explanation', message: '解析过短（至少 4 个字符）' })
    return null
  }
  const difficultyRaw = Number(row.difficulty ?? 2)
  const difficulty: Difficulty = difficultyRaw === 1 || difficultyRaw === 3 ? difficultyRaw : 2
  const tags = asString(row.tags)
    ? asString(row.tags).split(/[;；|]/).map((tag) => tag.trim()).filter(Boolean)
    : []
  return { type, stem, options, answer, explanation, difficulty, tags }
}

function normalizeMeta(raw: Record<string, unknown>): Pick<
  ImportBankInput,
  'title' | 'subtitle' | 'description' | 'exam' | 'icon' | 'accent' | 'level' | 'durationMin' | 'tags'
> {
  const title = asString(raw.title) || '未命名题库'
  const levelRaw = asString(raw.level)
  const level = (LEVELS as readonly string[]).includes(levelRaw)
    ? (levelRaw as ImportBankInput['level'])
    : '入门'
  const durationRaw = Number(raw.durationMin)
  const accentRaw = asString(raw.accent)
  return {
    title,
    subtitle: asString(raw.subtitle) || '导入题库',
    description: asString(raw.description) || '通过导入功能创建的题库。',
    exam: asString(raw.exam) || title,
    icon: asString(raw.icon) || 'book',
    accent: /^#[0-9a-fA-F]{6}$/.test(accentRaw) ? accentRaw : ACCENTS[Math.abs(hashCode(title)) % ACCENTS.length],
    level,
    durationMin: Number.isFinite(durationRaw) && durationRaw > 0 ? Math.min(300, Math.round(durationRaw)) : Math.max(5, 10),
    tags: Array.isArray(raw.tags)
      ? raw.tags.map(asString).filter(Boolean)
      : asString(raw.tags).split(/[;；|]/).map((tag) => tag.trim()).filter(Boolean),
  }
}

export function hashCode(text: string): number {
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0
  }
  return hash
}

export function parseImportJson(raw: string): ParseResult {
  const issues: ImportIssue[] = []
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch (error) {
    return {
      bank: null,
      issues: [{ line: 0, field: 'file', message: `JSON 解析失败：${error instanceof Error ? error.message : '未知错误'}` }],
      questionCount: 0,
    }
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { bank: null, issues: [{ line: 0, field: 'file', message: '顶层必须是对象 { title, questions: [...] }' }], questionCount: 0 }
  }
  const root = data as Record<string, unknown>
  const rawQuestions = root.questions
  if (!Array.isArray(rawQuestions)) {
    return { bank: null, issues: [{ line: 0, field: 'questions', message: '缺少 questions 数组' }], questionCount: 0 }
  }
  if (rawQuestions.length === 0) {
    return { bank: null, issues: [{ line: 0, field: 'questions', message: 'questions 数组为空' }], questionCount: 0 }
  }
  if (rawQuestions.length > 2000) {
    return { bank: null, issues: [{ line: 0, field: 'questions', message: '单次最多导入 2000 题' }], questionCount: 0 }
  }
  const seen = new Set<string>()
  const questions: ImportQuestionInput[] = []
  rawQuestions.forEach((item, index) => {
    const line = index + 1
    const seed = normalizeQuestionRow(item, line, issues)
    if (!seed) return
    const dedupe = seed.stem
    if (seen.has(dedupe)) {
      issues.push({ line, field: 'stem', message: '题干与前面某题重复，已跳过' })
      return
    }
    seen.add(dedupe)
    questions.push(seed)
  })
  if (questions.length === 0) {
    return { bank: null, issues, questionCount: 0 }
  }
  const meta = normalizeMeta(root)
  return { bank: { ...meta, questions }, issues, questionCount: questions.length }
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells
}

export function parseImportCsv(raw: string): ParseResult {
  const issues: ImportIssue[] = []
  const lines = raw.replace(/\r\n?/g, '\n').split('\n').filter((line, index, all) =>
    !(index === all.length - 1 && line.trim() === ''),
  )
  if (lines.length < 2) {
    return { bank: null, issues: [{ line: 1, field: 'file', message: 'CSV 至少需要表头 + 1 行数据' }], questionCount: 0 }
  }
  const headers = splitCsvLine(lines[0]).map((cell) => cell.trim())
  const headerSet = new Set(headers.map((cell) => cell.toLowerCase()))
  const required = HEADERS.filter((header) => header !== 'optionE' && header !== 'optionF')
  const missing = required.filter((header) => !headerSet.has(header.toLowerCase()))
  if (missing.length > 0) {
    return {
      bank: null,
      issues: [{ line: 1, field: 'header', message: `缺少列：${missing.join(', ')}` }],
      questionCount: 0,
    }
  }
  const seen = new Set<string>()
  const questions: ImportQuestionInput[] = []
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (!line.trim()) continue
    const cells = splitCsvLine(line)
    const row: Record<string, unknown> = {}
    headers.forEach((header, index) => {
      const key = HEADERS.find((candidate) => candidate.toLowerCase() === header.toLowerCase())
      if (key) row[key] = cells[index] ?? ''
    })
    const seed = seedFromRow(row, i + 1, issues)
    if (!seed) continue
    if (seen.has(seed.stem)) {
      issues.push({ line: i + 1, field: 'stem', message: '题干重复，已跳过' })
      continue
    }
    seen.add(seed.stem)
    questions.push(seed)
  }
  if (questions.length === 0) {
    return { bank: null, issues, questionCount: 0 }
  }
  const meta = normalizeMeta({})
  return { bank: { ...meta, questions }, issues, questionCount: questions.length }
}

export type ImportFormat = 'json' | 'csv'

export function detectFormat(fileName: string): ImportFormat | null {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.json')) return 'json'
  if (lower.endsWith('.csv')) return 'csv'
  return null
}

export function toQuestionSeeds(questions: ImportQuestionInput[]): QuestionSeed[] {
  return questions
}
