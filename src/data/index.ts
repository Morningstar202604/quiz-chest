import { collections } from './taxonomy'
import { makeQuestions } from './types'
import type { CollectionWithQuestions, Question } from './types'
import { k12Seeds } from './questions/k12'
import { universitySeeds } from './questions/university'
import { careerSeeds } from './questions/career'
import { languageSeeds } from './questions/language'
import { codingSeeds } from './questions/coding'
import { publicSeeds } from './questions/public'
import { generalSeeds } from './questions/general'

// 延迟注入：避免 data → library → store 的模块级循环依赖。
let importedLookup: {
  collection: (id: string) => CollectionWithQuestions | undefined
  question: (id: string) => Question | undefined
} | null = null

export function registerImportedLookup(lookup: {
  collection: (id: string) => CollectionWithQuestions | undefined
  question: (id: string) => Question | undefined
}): void {
  importedLookup = lookup
}

function lookupImportedCollection(id: string): CollectionWithQuestions | undefined {
  return importedLookup?.collection(id)
}

function lookupImportedQuestion(id: string): Question | undefined {
  return importedLookup?.question(id)
}

const seeds: Record<string, Parameters<typeof makeQuestions>[1]> = {
  ...k12Seeds,
  ...universitySeeds,
  ...careerSeeds,
  ...languageSeeds,
  ...codingSeeds,
  ...publicSeeds,
  ...generalSeeds,
}

export const builtinQuestionBank: CollectionWithQuestions[] = collections.map(
  (collection) => ({
    ...collection,
    questions: makeQuestions(collection.id, seeds[collection.id] ?? []),
  }),
)

// 兼容旧引用：示例题库即内置题库。运行期统一从 src/lib/library.ts 取合并视图。
export const questionBank = builtinQuestionBank

const byId = new Map(builtinQuestionBank.map((item) => [item.id, item]))
const questionById = new Map<string, Question>()
for (const collection of builtinQuestionBank) {
  for (const question of collection.questions) {
    questionById.set(question.id, question)
  }
}

export function getCollection(id: string): CollectionWithQuestions | undefined {
  const builtin = byId.get(id)
  if (builtin) return builtin
  // 导入题库不在内置映射里，从合并视图取（含 React 外的同步快照）。
  const imported = lookupImportedCollection(id)
  return imported ?? undefined
}

export function getQuestion(id: string): Question | undefined {
  const builtin = questionById.get(id)
  if (builtin) return builtin
  return lookupImportedQuestion(id)
}

export function getCollectionOfQuestion(questionId: string): CollectionWithQuestions | undefined {
  const question = questionById.get(questionId)
  return question ? byId.get(question.collectionId) : undefined
}

export const totalQuestions = questionBank.reduce(
  (sum, collection) => sum + collection.questions.length,
  0,
)

export function questionsOfDomain(domainId: string): Question[] {
  return questionBank
    .filter((collection) => collection.domainId === domainId)
    .flatMap((collection) => collection.questions)
}
