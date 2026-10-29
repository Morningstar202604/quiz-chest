import { describe, expect, it } from 'vitest'
import { detectFormat, normalizeId, parseImportCsv, parseImportJson } from './importer'

const validBank = {
  title: '前端面试 300 题',
  subtitle: '面试冲刺',
  exam: '前端面试',
  questions: [
    {
      type: 'single',
      stem: 'typeof null 的结果是什么？',
      options: ['"null"', '"object"', '"undefined"', '"boolean"'],
      answer: ['B'],
      explanation: 'typeof null 返回 object，这是 JavaScript 的历史遗留问题。',
      difficulty: 2,
      tags: ['类型'],
    },
    {
      type: 'multiple',
      stem: '下列哪些声明会创建块级作用域？',
      options: ['var', 'let', 'const', 'function'],
      answer: 'BC',
      explanation: 'let 与 const 都是块级作用域，var 是函数作用域。',
      difficulty: 1,
      tags: ['作用域'],
    },
    {
      type: 'judge',
      stem: '0.1 + 0.2 === 0.3 在 JavaScript 中成立。',
      options: ['正确', '错误'],
      answer: 'B',
      explanation: 'IEEE 754 浮点数存在精度误差，比较结果为 false。',
      difficulty: 2,
      tags: ['浮点数'],
    },
  ],
}

describe('parseImportJson', () => {
  it('parses a valid bank with letter answers', () => {
    const result = parseImportJson(JSON.stringify(validBank))
    expect(result.issues).toHaveLength(0)
    expect(result.questionCount).toBe(3)
    expect(result.bank?.questions[0].answer).toEqual([1])
    expect(result.bank?.questions[1].answer).toEqual([1, 2])
    expect(result.bank?.questions[2].type).toBe('judge')
    expect(result.bank?.level).toBe('入门')
    expect(result.bank?.accent).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('reports invalid JSON with a parse error', () => {
    const result = parseImportJson('{ not json')
    expect(result.bank).toBeNull()
    expect(result.issues[0].field).toBe('file')
    expect(result.issues[0].message).toContain('JSON 解析失败')
  })

  it('rejects missing questions array', () => {
    const result = parseImportJson('{"title":"x"}')
    expect(result.bank).toBeNull()
    expect(result.issues[0].field).toBe('questions')
  })

  it('rejects empty questions and over-limit banks', () => {
    const empty = parseImportJson('{"title":"x","questions":[]}')
    expect(empty.bank).toBeNull()
    const tooMany = parseImportJson(
      JSON.stringify({ title: 'x', questions: Array.from({ length: 2001 }, () => validBank.questions[0]) }),
    )
    expect(tooMany.bank).toBeNull()
    expect(tooMany.issues[0].message).toContain('2000')
  })

  it('collects per-row issues without aborting the whole file', () => {
    const data = {
      title: '混合质量',
      questions: [
        ...validBank.questions,
        { stem: '没有选项的题', options: ['只有A'], answer: 'A', explanation: '解析内容足够长' },
        { stem: '答案越界', options: ['A', 'B'], answer: 'E', explanation: '解析内容足够长' },
        { stem: '缺答案', options: ['A', 'B'], answer: '', explanation: '解析内容足够长' },
        { type: 'single', stem: '多答案的单选', options: ['A', 'B', 'C'], answer: 'AB', explanation: '解析内容足够长' },
        { stem: '解析太短', options: ['A', 'B'], answer: 'A', explanation: '短' },
      ],
    }
    const result = parseImportJson(JSON.stringify(data))
    expect(result.questionCount).toBe(3)
    expect(result.issues.length).toBe(5)
    expect(result.issues.map((issue) => issue.line)).toEqual([4, 5, 6, 7, 8])
  })

  it('deduplicates repeated stems', () => {
    const data = {
      title: '重复题',
      questions: [validBank.questions[0], validBank.questions[0]],
    }
    const result = parseImportJson(JSON.stringify(data))
    expect(result.questionCount).toBe(1)
    expect(result.issues[0].message).toContain('重复')
  })
})

describe('parseImportCsv', () => {
  const header = 'stem,optionA,optionB,optionC,optionD,answer,explanation,type,difficulty,tags'

  it('parses quoted CSV rows', () => {
    const csv = [
      header,
      '"含,逗号的题干",甲,乙,丙,丁,B,"解析,里有逗号",single,2,标点;语法',
      '判断题干,正确,错误,,,B,判断解析内容足够,judge,1,基础',
    ].join('\n')
    const result = parseImportCsv(csv)
    expect(result.questionCount).toBe(2)
    expect(result.issues).toHaveLength(0)
    expect(result.bank?.questions[0].stem).toBe('含,逗号的题干')
    expect(result.bank?.questions[0].answer).toEqual([1])
    expect(result.bank?.questions[0].tags).toEqual(['标点', '语法'])
  })

  it('rejects missing columns', () => {
    const result = parseImportCsv('stem,optionA\n题干,A')
    expect(result.bank).toBeNull()
    expect(result.issues[0].field).toBe('header')
    expect(result.issues[0].message).toContain('optionB')
  })

  it('reports per-line issues with line numbers', () => {
    const csv = [header, '缺答案题干,A,B,C,D,,解析内容足够长,single,2,'].join('\n')
    const result = parseImportCsv(csv)
    expect(result.questionCount).toBe(0)
    expect(result.issues[0]).toMatchObject({ line: 2, field: 'answer' })
  })

  it('handles CRLF line endings', () => {
    const csv = [header, '回车题干,A,B,C,D,A,回车解析内容足够,single,1,'].join('\r\n')
    const result = parseImportCsv(csv)
    expect(result.questionCount).toBe(1)
  })
})

describe('helpers', () => {
  it('detects format by extension', () => {
    expect(detectFormat('bank.json')).toBe('json')
    expect(detectFormat('bank.CSV')).toBe('csv')
    expect(detectFormat('bank.xlsx')).toBeNull()
  })

  it('builds stable unique ids from title', () => {
    const a = normalizeId('前端面试', 1)
    const b = normalizeId('前端面试', 2)
    expect(a.startsWith('6d3t3x6f4r4v6h4d4i6g4v45-1')).toBe(true)
    expect(b.startsWith('6d3t3x6f4r4v6h4d4i6g4v45-2')).toBe(true)
    expect(a).not.toBe(b)
    expect(normalizeId('!!!', 3)).toMatch(/^[a-z0-9-]*-3$/)
    expect(normalizeId('Front End', 4)).toMatch(/^front.*end-4$/)
  })
})
