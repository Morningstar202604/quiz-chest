import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getCollection } from '../data'
import type { Question } from '../data/types'
import { useAppStore } from '../store/useAppStore'
import { dateKey, isCorrect, typeLabel, LETTERS } from '../lib/quiz'
import { Badge, ProgressBar } from '../components/ui/primitives'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ChevronDown,
  CircleCheck,
  CircleHelp,
  CircleX,
  Clock,
  Flame,
  RotateCcw,
  Target,
  Trophy,
  X,
} from '../components/ui/icons'
import { useTimer } from '../hooks/useTimer'
import type { SessionMode } from '../lib/quiz'

const EMPTY_SELECTION: number[] = []

export function PracticePage() {
  const { collectionId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const collection = getCollection(collectionId)

  const modeParam = searchParams.get('mode')
  const mode: SessionMode =
    modeParam === 'exam' ? 'exam' : modeParam === 'review' ? 'review' : 'practice'

  const wrongBook = useAppStore((state) => state.wrongBook)
  const favorites = useAppStore((state) => state.favorites)
  const toggleFavorite = useAppStore((state) => state.toggleFavorite)
  const recordWrong = useAppStore((state) => state.recordWrong)
  const removeWrong = useAppStore((state) => state.removeWrong)
  const addHistory = useAppStore((state) => state.addHistory)
  const setLastCollection = useAppStore((state) => state.setLastCollection)
  const fontScale = useAppStore((state) => state.settings.fontScale)
  const autoNext = useAppStore((state) => state.settings.autoNext)

  const [answers, setAnswers] = useState<Record<string, number[]>>({})
  const [index, setIndex] = useState(0)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showOutline, setShowOutline] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const startedAt = useRef<number | null>(null)
  const finishedRef = useRef(false)

  const [questions] = useState<Question[]>(() => {
    if (!collection) return []
    if (mode === 'review') {
      return collection.questions.filter((question) => wrongBook[question.id])
    }
    return collection.questions
  })

  const elapsed = useTimer(true)

  const current = questions[index]
  const selection = current ? answers[current.id] ?? EMPTY_SELECTION : EMPTY_SELECTION
  const isChecked = current ? Boolean(checked[current.id]) : false
  const answeredCount = questions.filter((question) => (answers[question.id] ?? []).length > 0).length
  const reviewedCount = questions.filter((question) => checked[question.id]).length
  const correctCount = questions.filter(
    (question) => checked[question.id] && isCorrect(question, answers[question.id] ?? []),
  ).length

  const select = useCallback(
    (question: Question, optionIndex: number) => {
      if (!current) return
      if (checked[question.id]) return
      setAnswers((prev) => {
        const existing = prev[question.id] ?? []
        if (question.type === 'multiple') {
          const next = existing.includes(optionIndex)
            ? existing.filter((value) => value !== optionIndex)
            : [...existing, optionIndex].sort((a, b) => a - b)
          return { ...prev, [question.id]: next }
        }
        return { ...prev, [question.id]: [optionIndex] }
      })
    },
    [checked, current],
  )

  const submitQuestion = useCallback(() => {
    if (!current) return
    if (selection.length === 0) return
    setChecked((prev) => ({ ...prev, [current.id]: true }))
    setShowAnalysis(true)
    const correct = isCorrect(current, selection)
    if (!correct) {
      recordWrong({
        questionId: current.id,
        collectionId: current.collectionId,
        lastSelection: selection,
      })
    } else if (mode === 'review') {
      removeWrong(current.id)
    }
  }, [current, selection, recordWrong, removeWrong, mode])

  const goNext = useCallback(() => {
    if (index < questions.length - 1) {
      setIndex((value) => value + 1)
      setShowAnalysis(false)
    }
  }, [index, questions.length])

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((value) => value - 1)
      setShowAnalysis(false)
    }
  }, [index])

  const finish = useCallback(() => {
    if (!collection || finishedRef.current) return
    finishedRef.current = true
    const started = startedAt.current ?? Date.now()
    const durationSec = Math.max(1, Math.round((Date.now() - started) / 1000))
    let correct = 0
    let answered = 0
    for (const question of questions) {
      const picked = answers[question.id] ?? []
      if (picked.length === 0) continue
      answered += 1
      if (isCorrect(question, picked)) {
        correct += 1
      } else if (!checked[question.id]) {
        recordWrong({
          questionId: question.id,
          collectionId: question.collectionId,
          lastSelection: picked,
        })
      }
    }
    addHistory({
      id: `h_${Date.now()}`,
      mode,
      collectionId: collection.id,
      collectionTitle: collection.title,
      answered,
      correct,
      wrong: answered - correct,
      skipped: questions.length - answered,
      total: questions.length,
      accuracy: answered === 0 ? 0 : Math.round((correct / answered) * 100),
      durationSec,
      finishedAt: Date.now(),
      dateKey: dateKey(Date.now()),
    })
    setLastCollection(collection.id)
    navigate(`/result/${collection.id}?mode=${mode}&correct=${correct}&answered=${answered}&total=${questions.length}&duration=${durationSec}`)
  }, [collection, questions, answers, checked, mode, addHistory, navigate, recordWrong, setLastCollection])

  useEffect(() => {
    if (startedAt.current === null) startedAt.current = Date.now()
    if (collection) setLastCollection(collection.id)
  }, [collection, setLastCollection])

  useEffect(() => {
    if (!autoNext || mode !== 'practice') return undefined
    if (!current || !checked[current.id]) return undefined
    if (!isCorrect(current, answers[current.id] ?? [])) return undefined
    if (index >= questions.length - 1) return undefined
    const timer = window.setTimeout(() => {
      setIndex((value) => value + 1)
      setShowAnalysis(false)
    }, 900)
    return () => window.clearTimeout(timer)
  }, [autoNext, mode, current, checked, answers, index, questions.length])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!current) return
      const number = Number(event.key)
      if (Number.isInteger(number) && number >= 1 && number <= current.options.length) {
        select(current, number - 1)
      }
      if (event.key === 'Enter') {
        if (mode === 'exam') {
          if (index < questions.length - 1) goNext()
          else setConfirmSubmit(true)
        } else if (!isChecked && selection.length > 0) {
          submitQuestion()
        } else if (isChecked) {
          goNext()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, select, isChecked, selection.length, submitQuestion, goNext, mode, index, questions.length])

  if (!collection) {
    return (
      <div className="practice-missing">
        <h1>题库不存在</h1>
        <Link to="/catalog" className="button button-primary button-sm">
          返回题库总览
        </Link>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="practice-missing">
        <h1>{mode === 'review' ? '这个题库没有待复习的错题' : '这个题库暂时没有题目'}</h1>
        <p>
          {mode === 'review'
            ? '答错的题会自动进入错题本，先去完成一次顺序练习吧。'
            : '请返回题库详情，选择其他练习方式。'}
        </p>
        <Link to={`/collection/${collection.id}`} className="button button-primary button-sm">
          返回题库
        </Link>
      </div>
    )
  }

  const progress = Math.round(((index + 1) / questions.length) * 100)
  const modeLabel = mode === 'exam' ? '模拟考试' : mode === 'review' ? '错题重练' : '顺序练习'

  return (
    <div className={`practice-shell font-${fontScale}${showOutline ? ' outline-open' : ''}`}>
      <header className="practice-topbar">
        <button
          className="icon-button"
          onClick={() => {
            if (window.confirm('退出本次练习？当前作答不会保存。')) {
              navigate(`/collection/${collection.id}`)
            }
          }}
          aria-label="退出练习"
        >
          <ArrowLeft />
        </button>
        <div className="practice-title">
          <span className="practice-mode">{modeLabel}</span>
          <strong>{collection.title}</strong>
        </div>
        <div className="practice-timer mono">
          <Clock /> {elapsed}
        </div>
        <button
          className={`icon-button${showOutline ? ' active' : ''}`}
          onClick={() => setShowOutline((value) => !value)}
          aria-label="答题卡"
          aria-expanded={showOutline}
        >
          <Target />
        </button>
        <button className="button button-primary button-sm practice-submit" onClick={() => setConfirmSubmit(true)}>
          交卷
        </button>
      </header>

      <div className="practice-progress">
        <ProgressBar value={progress} label="答题进度" />
        <span className="mono">
          {index + 1} / {questions.length}
        </span>
      </div>

      <main className="practice-main">
        <article className="question-card" aria-live="polite">
          <div className="question-meta">
            <Badge tone="accent">{typeLabel(current.type)}</Badge>
            <Badge tone="neutral">难度 {'●'.repeat(current.difficulty)}</Badge>
            <span className="question-id mono">Q{String(index + 1).padStart(2, '0')}</span>
            <button
              className={`favorite-button${favorites.includes(current.id) ? ' active' : ''}`}
              onClick={() => toggleFavorite(current.id)}
              aria-label={favorites.includes(current.id) ? '取消收藏' : '收藏本题'}
              aria-pressed={favorites.includes(current.id)}
            >
              <Bookmark />
            </button>
          </div>

          <h1 className="question-stem">{current.stem}</h1>
          <p className="question-hint">
            {current.type === 'multiple' ? '多选题：选出全部正确选项' : '请选择一个答案'}
            <span className="keyboard-hint">
              {mode === 'exam'
                ? ` · 键盘 1-${current.options.length} 选择，Enter 进入下一题`
                : ` · 键盘 1-${current.options.length} 选择，Enter 提交`}
            </span>
          </p>

          <div className="options" role="group" aria-label="选项">
            {current.options.map((option, optionIndex) => {
              const picked = selection.includes(optionIndex)
              const correctOption = current.answer.includes(optionIndex)
              const state = isChecked
                ? correctOption
                  ? 'correct'
                  : picked
                    ? 'wrong'
                    : 'idle'
                : picked
                  ? 'picked'
                  : 'idle'
              return (
                <button
                  key={optionIndex}
                  className={`option option-${state}`}
                  onClick={() => select(current, optionIndex)}
                  aria-pressed={picked}
                  disabled={isChecked && mode !== 'exam'}
                >
                  <span className="option-letter mono">{LETTERS[optionIndex]}</span>
                  <span className="option-text">{option}</span>
                  {isChecked && correctOption ? <CircleCheck className="option-mark" /> : null}
                  {isChecked && picked && !correctOption ? <CircleX className="option-mark" /> : null}
                </button>
              )
            })}
          </div>

          {isChecked && mode !== 'exam' ? (
            <section className={`analysis${showAnalysis ? ' open' : ''}`} aria-label="答案解析">
              <header className="analysis-head">
                <span className={isCorrect(current, selection) ? 'ok' : 'bad'}>
                  {isCorrect(current, selection) ? <CircleCheck /> : <CircleX />}
                  {isCorrect(current, selection) ? '回答正确' : '回答错误'}
                </span>
                <span className="analysis-answer">
                  正确答案：
                  <strong className="mono">
                    {current.answer.map((value) => LETTERS[value]).join('、')}
                  </strong>
                </span>
              </header>
              <div className="analysis-body">
                <h3>解析</h3>
                <p>{current.explanation}</p>
                <div className="analysis-tags">
                  {current.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <div className="question-actions">
            <button
              className="button button-ghost"
              onClick={goPrev}
              disabled={index === 0}
            >
              <ArrowLeft /> 上一题
            </button>
            {!isChecked && mode !== 'exam' ? (
              <button
                className="button button-primary"
                onClick={submitQuestion}
                disabled={selection.length === 0}
              >
                确认答案 <ChevronDown className="rotate-icon" />
              </button>
            ) : null}
            {isChecked || mode === 'exam' ? (
              <button
                className="button button-primary"
                onClick={index === questions.length - 1 ? () => setConfirmSubmit(true) : goNext}
              >
                {index === questions.length - 1 ? '完成练习' : '下一题'} <ArrowRight />
              </button>
            ) : null}
          </div>
        </article>

        <aside className="practice-aside">
          <div className="aside-block">
            <span className="aside-title">本次进度</span>
            <div className="aside-progress-row">
              <strong className="mono">{answeredCount}</strong>
              <span>/ {questions.length} 已作答</span>
            </div>
            {mode === 'exam' ? null : (
              <div className="aside-progress-row">
                <strong className="mono">{correctCount}</strong>
                <span>题答对 / 已核对 {reviewedCount}</span>
              </div>
            )}
            <button
              className="aside-link"
              onClick={() => {
                if (mode === 'exam') {
                  setConfirmSubmit(true)
                } else {
                  const firstUnanswered = questions.findIndex(
                    (question) => (answers[question.id] ?? []).length === 0,
                  )
                  if (firstUnanswered >= 0) {
                    setIndex(firstUnanswered)
                    setShowAnalysis(false)
                  }
                }
              }}
            >
              {mode === 'exam' ? '提前交卷' : '跳到未作答'}
            </button>
          </div>

          <div className="aside-block outline-block">
            <button
              className="aside-title-button"
              onClick={() => setShowOutline((value) => !value)}
              aria-expanded={showOutline}
            >
              <span className="aside-title">答题卡</span>
              <ChevronDown className={showOutline ? 'flip' : ''} />
            </button>
            {showOutline ? (
              <div className="outline-grid">
                {questions.map((question, questionIndex) => {
                  const picked = (answers[question.id] ?? []).length > 0
                  const done = Boolean(checked[question.id])
                  return (
                    <button
                      key={question.id}
                      className={`outline-cell${picked ? ' picked' : ''}${
                        done ? (isCorrect(question, answers[question.id] ?? []) ? ' right' : ' wrong') : ''
                      }${questionIndex === index ? ' current' : ''}`}
                      onClick={() => {
                        setIndex(questionIndex)
                        setShowAnalysis(false)
                        if (window.matchMedia('(max-width: 560px)').matches) {
                          setShowOutline(false)
                        }
                      }}
                    >
                      {questionIndex + 1}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>

          <div className="aside-tip">
            <CircleHelp />
            <p>
              {mode === 'exam'
                ? '考试模式不即时批改，交卷后统一查看得分与解析。'
                : '提交答案后立即查看解析，错题会自动收录到错题本。'}
            </p>
          </div>
        </aside>
      </main>

      {confirmSubmit ? (
        <div className="confirm-layer" role="presentation" onClick={() => setConfirmSubmit(false)}>
          <div
            className="confirm-card"
            role="dialog"
            aria-modal="true"
            aria-label="确认交卷"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="icon-button confirm-close" onClick={() => setConfirmSubmit(false)} aria-label="关闭">
              <X />
            </button>
            <span className="confirm-icon">
              <Trophy />
            </span>
            <h2 className="serif">确认提交本次{modeLabel}？</h2>
            <p>
              已作答 {answeredCount} / {questions.length} 题
              {answeredCount < questions.length ? `，还有 ${questions.length - answeredCount} 题未作答` : ''}。
              提交后将生成成绩单，未作答按跳过计。
            </p>
            <div className="confirm-actions">
              <button className="button button-ghost" onClick={() => setConfirmSubmit(false)}>
                继续作答
              </button>
              <button className="button button-primary" onClick={finish}>
                提交并查看结果
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {mode === 'review' ? (
        <div className="review-flag">
          <RotateCcw /> 错题重练答对后将从错题本移除
        </div>
      ) : null}

      <div className="practice-footer-meta">
        <Flame /> {mode === 'exam' ? '保持专注，交卷后可查看完整解析' : '做完一题就立刻对答案，记得更牢'}
      </div>
    </div>
  )
}
