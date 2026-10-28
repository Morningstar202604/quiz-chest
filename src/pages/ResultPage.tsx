import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getCollection } from '../data'
import { useAppStore } from '../store/useAppStore'
import { formatDuration, percent } from '../lib/quiz'
import { Badge } from '../components/ui/primitives'
import {
  ArrowRight,
  CircleCheck,
  CircleHelp,
  CircleX,
  Clock,
  Flame,
  RotateCcw,
  Target,
  Trophy,
} from '../components/ui/icons'

export function ResultPage() {
  const { collectionId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const collection = getCollection(collectionId)
  const history = useAppStore((state) => state.history)
  const wrongBook = useAppStore((state) => state.wrongBook)
  const favorites = useAppStore((state) => state.favorites)

  const mode = searchParams.get('mode') ?? 'practice'
  const correct = Number(searchParams.get('correct') ?? 0)
  const answered = Number(searchParams.get('answered') ?? 0)
  const total = Number(searchParams.get('total') ?? 0)
  const duration = Number(searchParams.get('duration') ?? 0)

  const accuracy = percent(correct, answered)
  const latest = history[0]

  const gained = useMemo(() => {
    if (!collection) return 0
    return collection.questions.filter((question) => favorites.includes(question.id)).length
  }, [collection, favorites])

  if (!collection) {
    return (
      <div className="result-page">
        <h1>结果不存在</h1>
        <Link to="/catalog" className="button button-primary button-sm">
          返回题库总览
        </Link>
      </div>
    )
  }

  const verdict =
    accuracy >= 90
      ? { label: '状态极佳', tone: 'success', text: '基础扎实，可以挑战更高难度的题库了。' }
      : accuracy >= 70
        ? { label: '稳步前进', tone: 'moss', text: '大部分考点已经掌握，重点复习错题即可。' }
        : accuracy >= 50
          ? { label: '仍需巩固', tone: 'gold', text: '建议回到解析，把错题对应的知识点重新过一遍。' }
          : { label: '从头梳理', tone: 'danger', text: '先慢下来理解概念，再做一次顺序练习。' }

  const wrongCount = answered - correct
  const skipped = total - answered

  return (
    <div className="result-page">
      <header className="result-hero">
        <span className="result-kicker">{mode === 'exam' ? '模拟考试' : mode === 'review' ? '错题重练' : '顺序练习'} · 已完成</span>
        <div className="result-score">
          <strong className="mono">{accuracy}</strong>
          <span>%</span>
        </div>
        <h1 className="serif">{verdict.label}</h1>
        <p>{verdict.text}</p>
        <div className="result-badges">
          <Badge tone={verdict.tone as 'success' | 'moss' | 'gold' | 'danger'}>{collection.title}</Badge>
          <Badge tone="neutral">{new Date().toLocaleString('zh-CN', { hour12: false })}</Badge>
        </div>
      </header>

      <section className="result-grid">
        <div className="result-stat">
          <CircleCheck />
          <strong className="mono">{correct}</strong>
          <span>答对</span>
        </div>
        <div className="result-stat">
          <CircleX />
          <strong className="mono">{wrongCount}</strong>
          <span>答错</span>
        </div>
        <div className="result-stat">
          <CircleHelp />
          <strong className="mono">{skipped}</strong>
          <span>跳过</span>
        </div>
        <div className="result-stat">
          <Clock />
          <strong className="mono">{formatDuration(duration)}</strong>
          <span>用时</span>
        </div>
      </section>

      <section className="result-detail">
        <div className="result-detail-head">
          <div>
            <span className="eyebrow">本次表现</span>
            <h2 className="serif">正确率 {accuracy}%</h2>
          </div>
          <div className="result-detail-meta">
            <span>
              <Target /> 共 {total} 题
            </span>
            <span>
              <Flame /> 错题已收录 {wrongCount} 题
            </span>
          </div>
        </div>
        <div className="accuracy-scale">
          <div className="accuracy-track">
            <span style={{ width: `${accuracy}%` }} />
            <i style={{ left: '70%' }} />
          </div>
          <div className="accuracy-labels">
            <span>0</span>
            <span>70% 掌握线</span>
            <span>100%</span>
          </div>
        </div>
        <div className="result-notes">
          <div>
            <h3>下一步</h3>
            <p>
              {wrongCount > 0
                ? `有 ${wrongCount} 道错题已加入错题本，建议 24 小时内复习一次。`
                : '本次没有错题，可以尝试模拟考试模式检验稳定性。'}
            </p>
          </div>
          <div>
            <h3>收藏</h3>
            <p>你在本库共收藏了 {gained} 道题，可在「我的收藏」集中回顾。</p>
          </div>
          <div>
            <h3>连续练习</h3>
            <p>
              保持每日练习，累计记录会显示在「学习统计」里。当前错题本共{' '}
              {Object.keys(wrongBook).length} 题。
            </p>
          </div>
        </div>
      </section>

      <div className="result-actions">
        <Link to={`/collection/${collection.id}`} className="button button-ghost">
          返回题库
        </Link>
        <Link to={`/practice/${collection.id}?mode=review`} className="button button-ghost">
          <RotateCcw /> 错题重练
        </Link>
        <Link to={`/practice/${collection.id}?mode=practice`} className="button button-primary">
          再练一次 <ArrowRight />
        </Link>
      </div>

      <section className="result-review">
        <div className="section-head">
          <div>
            <span className="eyebrow">错题回顾</span>
            <h2 className="section-title serif">把错的地方看明白</h2>
          </div>
          <Link to="/wrong" className="section-link">
            打开错题本 <ArrowRight />
          </Link>
        </div>
        {wrongCount === 0 ? (
          <div className="result-perfect">
            <Trophy />
            <p>全对。这组题的知识点已经过关，换一组继续扩展边界。</p>
          </div>
        ) : (
          <div className="result-review-list">
            {collection.questions
              .filter((question) => wrongBook[question.id])
              .slice(0, 5)
              .map((question) => (
                <div key={question.id} className="result-review-item">
                  <span className="review-index mono">Q</span>
                  <div>
                    <strong>{question.stem}</strong>
                    <p>{question.explanation}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {latest ? (
        <p className="result-footnote">
          最近一次记录已保存 · {new Date(latest.finishedAt).toLocaleString('zh-CN', { hour12: false })}
        </p>
      ) : null}
    </div>
  )
}
