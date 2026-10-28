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

const seeds: Record<string, Parameters<typeof makeQuestions>[1]> = {
  ...k12Seeds,
  ...universitySeeds,
  ...careerSeeds,
  ...languageSeeds,
  ...codingSeeds,
  ...publicSeeds,
  ...generalSeeds,
}

export const questionBank: CollectionWithQuestions[] = collections.map(
  (collection) => ({
    ...collection,
    questions: makeQuestions(collection.id, seeds[collection.id] ?? []),
  }),
)

const byId = new Map(questionBank.map((item) => [item.id, item]))
const questionById = new Map<string, Question>()
for (const collection of questionBank) {
  for (const question of collection.questions) {
    questionById.set(question.id, question)
  }
}

export function getCollection(id: string): CollectionWithQuestions | undefined {
  return byId.get(id)
}

export function getQuestion(id: string): Question | undefined {
  return questionById.get(id)
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
