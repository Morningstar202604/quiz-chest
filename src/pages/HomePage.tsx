import { Link } from 'react-router-dom'
import { collections, domains } from '../data/taxonomy'
import { questionBank, totalQuestions, getCollection } from '../data'
import { useAppStore } from '../store/useAppStore'
import { dateKey, percent, streakFromDates } from '../lib/quiz'
import {
  ArrowRight,
  Bookmark,
  ChevronRight,
  Clock,
  Flame,
  Layers,
  Library,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from '../components/ui/icons'
import { DomainIcon } from '../components/ui/icons'
import { Badge, EmptyState, ProgressBar, Stat } from '../components/ui/primitives'

const TODAY_KEY = dateKey(Date.now())

export function HomePage() {
  const history = useAppStore((state) => state.history)
  const daily = useAppStore((state) => state.daily)
  const wrongBook = useAppStore((state) => state.wrongBook)
  const favorites = useAppStore((state) => state.favorites)
  const lastCollectionId = useAppStore((state) => state.lastCollectionId)
  const lastCollection = lastCollectionId ? getCollection(lastCollectionId) : undefined
  const streak = streakFromDates(Object.keys(daily))

  const totalAnswered = Object.values(daily).reduce((sum, item) => sum + item.answered, 0)
  const totalCorrect = Object.values(daily).reduce((sum, item) => sum + item.correct, 0)
  const accuracy = percent(totalCorrect, totalAnswered)
  const lastSession = history[0]

  const todayKey = TODAY_KEY
  const todayAnswered = daily[todayKey]?.answered ?? 0

  const recommended = [...collections].sort((a, b) => b.heat - a.heat).slice(0, 4)
  const featured = collections.find((item) => item.id === 'js-basics') ?? collections[0]

  return (
    <div className="home">
      <section className="welcome">
        <div className="welcome-main">
          <span className="eyebrow">
            <Sparkles /> 今日题库
          </span>
          <h1 className="welcome-title serif">
            把每一个知识点，
            <br />
            都变成<span className="accent-underline">确定会做</span>的题。
          </h1>
          <p className="welcome-sub">
            七大领域，{collections.length} 个题库，{totalQuestions} 道精选题。
            从升学、考证到编程与通识，按你的目标直接开练。
          </p>
          <div className="welcome-actions">
            {lastCollection ? (
              <Link
                to={`/practice/${lastCollection.id}?mode=practice`}
                className="button button-primary"
              >
                <Zap />
                继续学习 · {lastCollection.title}
              </Link>
            ) : (
              <Link to="/catalog" className="button button-primary">
                <Library />
                开始第一组练习
              </Link>
            )}
            <Link to="/catalog" className="button button-ghost">
              浏览全部题库
              <ArrowRight />
            </Link>
          </div>
        </div>
        <aside className="welcome-aside" aria-label="今日概览">
          <div className="ordeal-card">
            <span className="ordeal-label">今日进度</span>
            <div className="ordeal-value">
              <strong className="mono">{String(todayAnswered).padStart(2, '0')}</strong>
              <span>题</span>
            </div>
            <ProgressBar value={Math.min(100, (todayAnswered / 20) * 100)} label="今日刷题进度" />
            <div className="ordeal-foot">
              <span>
                <Flame /> 连续 {streak} 天
              </span>
              <span>{todayAnswered >= 20 ? '已达标' : `还差 ${20 - todayAnswered} 题达标`}</span>
            </div>
          </div>
          <div className="aside-note">
            <p className="serif">“学而时习之，不亦说乎。”</p>
            <span>每日目标 20 题，重在持续，不在一次刷完。</span>
          </div>
        </aside>
      </section>

      <section className="stat-strip" aria-label="学习概况">
        <Stat label="累计作答" value={totalAnswered} hint="覆盖全部题库" icon={<Layers />} />
        <Stat
          label="平均正确率"
          value={`${accuracy}%`}
          hint={totalAnswered > 0 ? `答对 ${totalCorrect} 题` : '完成练习后生成'}
          icon={<TrendingUp />}
        />
        <Stat
          label="错题待复习"
          value={Object.keys(wrongBook).length}
          hint="按错误次数排序"
          icon={<Target />}
        />
        <Stat label="收藏题目" value={favorites.length} hint="随时回看" icon={<Bookmark />} />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">分类导航</span>
            <h2 className="section-title serif">七大领域，找到你的战场</h2>
          </div>
          <Link to="/catalog" className="section-link">
            全部题库 <ChevronRight />
          </Link>
        </div>
        <div className="domain-grid">
          {domains.map((domain) => {
            const owned = collections.filter((item) => item.domainId === domain.id)
            const count = owned.reduce((sum, item) => sum + (questionBank.find((entry) => entry.id === item.id)?.questions.length ?? 0), 0)
            return (
              <Link
                key={domain.id}
                to={`/domain/${domain.id}`}
                className="domain-card"
                style={{ '--domain-accent': domain.accent } as React.CSSProperties}
              >
                <div className="domain-card-top">
                  <span className="domain-card-mark">
                    <DomainIcon name={domain.icon} />
                  </span>
                  <span className="domain-card-index mono">{domain.index}</span>
                </div>
                <h3>{domain.name}</h3>
                <p>{domain.description}</p>
                <div className="domain-card-foot">
                  <span>{owned.length} 个题库</span>
                  <span className="dot-sep">·</span>
                  <span>{count} 题</span>
                  <ChevronRight className="domain-arrow" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="split-section">
        <div className="section split-main">
          <div className="section-head">
            <div>
              <span className="eyebrow">精选推荐</span>
              <h2 className="section-title serif">本周最热题库</h2>
            </div>
            <Link to="/catalog" className="section-link">
              更多 <ChevronRight />
            </Link>
          </div>
          <div className="collection-list">
            {recommended.map((collection, index) => {
              const domain = domains.find((item) => item.id === collection.domainId)
              return (
                <Link
                  key={collection.id}
                  to={`/collection/${collection.id}`}
                  className="collection-row"
                >
                  <span className="collection-rank mono">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className="collection-row-icon"
                    style={{ color: domain?.accent }}
                  >
                    <DomainIcon name={collection.icon} />
                  </span>
                  <span className="collection-row-text">
                    <span className="collection-row-title">
                      {collection.title}
                      <Badge tone="neutral">{collection.exam}</Badge>
                    </span>
                    <span className="collection-row-sub">{collection.subtitle}</span>
                  </span>
                  <span className="collection-row-meta">
                    <Clock /> {collection.durationMin} 分钟
                  </span>
                  <span className="collection-row-heat mono">{collection.heat}°</span>
                </Link>
              )
            })}
          </div>
        </div>

        <aside className="section split-side">
          <div className="section-head">
            <div>
              <span className="eyebrow">学习轨迹</span>
              <h2 className="section-title serif">最近一次</h2>
            </div>
          </div>
          {lastSession ? (
            <div className="recent-card">
              <div className="recent-head">
                <Trophy />
                <span>{lastSession.mode === 'exam' ? '模拟考试' : '练习'}已完成</span>
              </div>
              <h3>{lastSession.collectionTitle}</h3>
              <div className="recent-score">
                <strong className="mono">{lastSession.accuracy}%</strong>
                <span>
                  答对 {lastSession.correct} / {lastSession.total} 题
                </span>
              </div>
              <div className="recent-meta">
                <span>
                  <Clock /> {Math.max(1, Math.round(lastSession.durationSec / 60))} 分钟
                </span>
                <span>
                  <Target /> 错 {lastSession.wrong} 题
                </span>
              </div>
              <Link to="/history" className="text-link">
                查看全部记录 <ArrowRight />
              </Link>
            </div>
          ) : (
            <EmptyState
              icon={<Trophy />}
              title="还没有练习记录"
              description="完成任意一组题后，这里会显示你的成绩与用时。"
              action={
                <Link to="/catalog" className="button button-primary button-sm">
                  去选一个题库
                </Link>
              }
            />
          )}
        </aside>
      </section>

      <section className="feature-band">
        <div className="feature-copy">
          <span className="eyebrow">每日一练</span>
          <h2 className="serif">今天，先从 {featured.title} 开始</h2>
          <p>{featured.description}</p>
          <div className="feature-actions">
            <Link to={`/collection/${featured.id}`} className="button button-ink">
              查看题库
              <ArrowRight />
            </Link>
            <span className="feature-meta">
              {(questionBank.find((entry) => entry.id === featured.id)?.questions.length ?? 0)} 题 · 预计 {featured.durationMin} 分钟
            </span>
          </div>
        </div>
        <div className="feature-figure" aria-hidden="true">
          <span className="figure-numeral serif">题</span>
          <span className="figure-caption">Practice makes permanent.</span>
        </div>
      </section>
    </div>
  )
}
