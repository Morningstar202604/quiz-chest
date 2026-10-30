import { describe, expect, it } from 'vitest'
import { buildExportPackage, exportFileName, looksLikeExportPackage, parseExportPackage } from './exporter'
import { parseImportJson } from './importer'
import type { ImportedBank } from '../store/useAppStore'

const bank: ImportedBank = {
  id: 'demo-abc',
  title: '前端面试 300 题',
  subtitle: '面试冲刺',
  description: '按面试真题整理',
  exam: '前端面试',
  icon: 'braces',
  accent: '#3E4C59',
  level: '进阶',
  durationMin: 30,
  tags: ['JavaScript', '面试'],
  importedAt: 1735689600000,
  questions: [
    {
      type: 'single',
      stem: 'typeof null 的结果是什么？',
      options: ['"null"', '"object"', '"undefined"', '"boolean"'],
      answer: [1],
      explanation: 'typeof null 返回 object，这是 JavaScript 的历史遗留问题。',
      difficulty: 2,
      tags: ['类型'],
    },
  ],
}

describe('buildExportPackage', () => {
  it('wraps bank with tiyu-bank format marker', () => {
    const pkg = buildExportPackage(bank)
    expect(pkg.format).toBe('tiyu-bank')
    expect(pkg.version).toBe(1)
    expect(pkg.bank.title).toBe(bank.title)
    expect(pkg.bank.questions).toHaveLength(1)
    expect(pkg.exportedAt).toBeTruthy()
  })

  it('builds a safe file name with date', () => {
    const name = exportFileName(bank)
    expect(name).toBe('前端面试-300-题-2025-01-01.tiyu.json')
  })

  it('strips forbidden characters from file name', () => {
    const name = exportFileName({ ...bank, title: 'a/b:c*d?' })
    expect(name.startsWith('abcd-')).toBe(true)
    expect(name.endsWith('.tiyu.json')).toBe(true)
  })
})

describe('parseExportPackage', () => {
  it('round-trips a package built by buildExportPackage', () => {
    const raw = JSON.stringify(buildExportPackage(bank))
    const result = parseExportPackage(raw)
    expect(result.error).toBe('')
    expect(result.bank?.title).toBe(bank.title)
    expect(result.bank?.questions[0].answer).toEqual([1])
    expect(result.bank?.level).toBe('进阶')
  })

  it('rejects plain question JSON without tiyu-bank marker', () => {
    const raw = JSON.stringify({ title: 'x', questions: [{ stem: 's', options: ['a', 'b'], answer: ['A'], explanation: 'explanation' }] })
    const result = parseExportPackage(raw)
    expect(result.bank).toBeNull()
    expect(result.error).toContain('tiyu-bank')
  })

  it('rejects broken JSON', () => {
    const result = parseExportPackage('{ broken')
    expect(result.bank).toBeNull()
    expect(result.error).toContain('解析失败')
  })

  it('rejects packages with empty questions', () => {
    const raw = JSON.stringify({ format: 'tiyu-bank', version: 1, bank: { title: 'x', questions: [] } })
    const result = parseExportPackage(raw)
    expect(result.bank).toBeNull()
    expect(result.error).toContain('没有题目')
  })
})

describe('looksLikeExportPackage', () => {
  it('detects the marker and distinguishes plain imports', () => {
    expect(looksLikeExportPackage(JSON.stringify(buildExportPackage(bank)))).toBe(true)
    expect(looksLikeExportPackage('{"title":"普通导入","questions":[]}')).toBe(false)
  })
})

describe('export/import round-trip through the regular importer', () => {
  it('a tiyu package is NOT parsed by parseImportJson (routes to parseExportPackage instead)', () => {
    const raw = JSON.stringify(buildExportPackage(bank))
    // 普通 JSON 解析器会因为没有 options/optionA 字段报错——所以 runParse 必须先走包识别
    const plain = parseImportJson(raw)
    expect(plain.bank).toBeNull()
    expect(looksLikeExportPackage(raw)).toBe(true)
  })
})
