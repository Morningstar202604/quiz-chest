import type { ImportedBank } from '../store/useAppStore'
import type { ImportBankInput } from './importer'

export interface ExportPackage {
  format: 'tiyu-bank'
  version: 1
  exportedAt: string
  bank: ImportBankInput
}

export function buildExportPackage(bank: ImportedBank): ExportPackage {
  return {
    format: 'tiyu-bank',
    version: 1,
    exportedAt: new Date().toISOString(),
    bank: {
      title: bank.title,
      subtitle: bank.subtitle,
      description: bank.description,
      exam: bank.exam,
      icon: bank.icon,
      accent: bank.accent,
      level: bank.level,
      durationMin: bank.durationMin,
      tags: bank.tags,
      questions: bank.questions,
    },
  }
}

export function exportFileName(bank: ImportedBank): string {
  const slug = bank.title
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40)
  const date = new Date(bank.importedAt).toISOString().slice(0, 10)
  return `${slug || 'bank'}-${date}.tiyu.json`
}

export function downloadBankPackage(bank: ImportedBank): void {
  const payload = JSON.stringify(buildExportPackage(bank), null, 2)
  const blob = new Blob([payload], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = exportFileName(bank)
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function parseExportPackage(raw: string): { bank: ImportedBank | null; error: string } {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { bank: null, error: 'JSON 解析失败' }
  }
  if (typeof data !== 'object' || data === null) return { bank: null, error: '格式不正确' }
  const pkg = data as Partial<ExportPackage>
  if (pkg.format !== 'tiyu-bank' || typeof pkg.bank !== 'object' || pkg.bank === null) {
    return { bank: null, error: '不是题屿题库包（缺少 tiyu-bank 标识）' }
  }
  const bank = pkg.bank as ImportBankInput
  if (!Array.isArray(bank.questions) || bank.questions.length === 0) {
    return { bank: null, error: '题库包内没有题目' }
  }
  return {
    bank: {
      id: '',
      title: bank.title ?? '未命名题库',
      subtitle: bank.subtitle ?? '导入题库',
      description: bank.description ?? '',
      exam: bank.exam ?? bank.title ?? '未命名题库',
      icon: bank.icon ?? 'book',
      accent: bank.accent ?? '#315B7D',
      level: bank.level ?? '入门',
      durationMin: bank.durationMin ?? 10,
      tags: bank.tags ?? [],
      importedAt: 0,
      questions: bank.questions,
    },
    error: '',
  }
}

export function looksLikeExportPackage(raw: string): boolean {
  return raw.includes('"tiyu-bank"')
}
