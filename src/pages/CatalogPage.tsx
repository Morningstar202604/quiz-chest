import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { questionBank } from '../data'
import { domains, collections } from '../data/taxonomy'
import type { Level } from '../data/types'
import { Chip } from '../components/search/Chip'
import { Badge, EmptyState } from '../components/ui/primitives'
import { Clock, ChevronRight, Library, Search } from '../components/ui/icons'
import { DomainIcon } from '../components/ui/icons'

const levels: Array<Level | '全部'> = ['全部', '入门', '进阶', '挑战']

export function CatalogPage() {
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<Level | '全部'>('全部')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return questionBank.filter((collection) => {
      if (domainFilter !== 'all' && collection.domainId !== domainFilter) return false
      if (levelFilter !== '全部' && collection.level !== levelFilter) return false
      if (!keyword) return true
      return [
        collection.title,
        collection.subtitle,
        collection.description,
        collection.exam,
        ...collection.tags,
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    })
  }, [domainFilter, levelFilter, query])

  return (
    <div className="catalog-page">
      <header className="page-head">
        <div>
          <span className="eyebrow">题库总览</span>
          <h1 className="page-title serif">按领域与难度，精准找到要刷的题</h1>
          <p className="page-sub">
            共 {collections.length} 个题库。先选领域缩小范围，再用难度或关键词筛选。
          </p>
        </div>
      </header>

      <div className="catalog-toolbar">
        <div className="catalog-search">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索题库名称、考试类型或标签"
            aria-label="筛选题库"
          />
        </div>
        <div className="catalog-levels">
          {levels.map((level) => (
            <Chip key={level} active={levelFilter === level} onClick={() => setLevelFilter(level)}>
              {level}
            </Chip>
          ))}
        </div>
      </div>

      <div className="domain-filter" role="tablist" aria-label="领域筛选">
        <button
          role="tab"
          aria-selected={domainFilter === 'all'}
          className={`domain-filter-item${domainFilter === 'all' ? ' active' : ''}`}
          onClick={() => setDomainFilter('all')}
        >
          全部领域
          <span className="mono">{questionBank.length}</span>
        </button>
        {domains.map((domain) => {
          const count = questionBank.filter((item) => item.domainId === domain.id).length
          return (
            <button
              key={domain.id}
              role="tab"
              aria-selected={domainFilter === domain.id}
              className={`domain-filter-item${domainFilter === domain.id ? ' active' : ''}`}
              onClick={() => setDomainFilter(domain.id)}
            >
              {domain.name}
              <span className="mono">{count}</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="没有匹配的题库"
          description="调整领域、难度或关键词后再试一次。"
          action={
            <button
              className="button button-primary button-sm"
              onClick={() => {
                setQuery('')
                setDomainFilter('all')
                setLevelFilter('全部')
              }}
            >
              重置筛选
            </button>
          }
        />
      ) : (
        <div className="collection-grid">
          {filtered.map((collection) => {
            const domain = domains.find((item) => item.id === collection.domainId)
            return (
              <Link
                key={collection.id}
                to={`/collection/${collection.id}`}
                className="collection-card"
                style={{ '--card-accent': domain?.accent ?? 'var(--accent)' } as React.CSSProperties}
              >
                <div className="collection-card-head">
                  <span className="collection-card-icon">
                    <DomainIcon name={collection.icon} />
                  </span>
                  <Badge tone="neutral">{collection.level}</Badge>
                </div>
                <h3>{collection.title}</h3>
                <p>{collection.subtitle}</p>
                <div className="collection-card-tags">
                  {collection.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="collection-card-foot">
                  <span>
                    <Library /> {collection.questions.length} 题
                  </span>
                  <span>
                    <Clock /> {collection.durationMin} 分钟
                  </span>
                  <span className="collection-card-go">
                    <ChevronRight />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function DomainPage() {
  const { domainId = '' } = useParams()
  const domain = domains.find((item) => item.id === domainId)
  if (!domain) {
    return (
      <EmptyState
        icon={<Library />}
        title="领域不存在"
        description="该分类可能已被调整，请返回题库总览重新选择。"
        action={
          <Link to="/catalog" className="button button-primary button-sm">
            返回题库总览
          </Link>
        }
      />
    )
  }

  const owned = questionBank.filter((collection) => collection.domainId === domain.id)
  const count = owned.reduce((sum, item) => sum + item.questions.length, 0)

  return (
    <div className="domain-page" style={{ '--domain-accent': domain.accent } as React.CSSProperties}>
      <header className="domain-hero">
        <div className="domain-hero-mark">
          <DomainIcon name={domain.icon} />
        </div>
        <div className="domain-hero-text">
          <span className="eyebrow">
            {domain.index} / {domain.en}
          </span>
          <h1 className="page-title serif">{domain.name}</h1>
          <p className="page-sub">{domain.description}</p>
          <div className="domain-hero-meta">
            <span>{owned.length} 个题库</span>
            <span className="dot-sep">·</span>
            <span>{count} 道题目</span>
            <span className="dot-sep">·</span>
            <span>{domain.tagline}</span>
          </div>
        </div>
      </header>

      <div className="section-head">
        <div>
          <span className="eyebrow">领域内题库</span>
          <h2 className="section-title serif">选择一个方向开始</h2>
        </div>
        <Link to="/catalog" className="section-link">
          全部题库 <ChevronRight />
        </Link>
      </div>

      <div className="collection-grid">
        {owned.map((collection) => (
          <Link
            key={collection.id}
            to={`/collection/${collection.id}`}
            className="collection-card"
            style={{ '--card-accent': domain.accent } as React.CSSProperties}
          >
            <div className="collection-card-head">
              <span className="collection-card-icon">
                <DomainIcon name={collection.icon} />
              </span>
              <Badge tone="neutral">{collection.level}</Badge>
            </div>
            <h3>{collection.title}</h3>
            <p>{collection.subtitle}</p>
            <div className="collection-card-tags">
              {collection.tags.slice(0, 3).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="collection-card-foot">
              <span>
                <Library /> {collection.questions.length} 题
              </span>
              <span>
                <Clock /> {collection.durationMin} 分钟
              </span>
              <span className="collection-card-go">
                <ChevronRight />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
