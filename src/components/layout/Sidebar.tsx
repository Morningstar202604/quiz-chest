import { NavLink, useLocation } from 'react-router-dom'
import { domains } from '../../data/taxonomy'
import { collections } from '../../data/taxonomy'
import { useAppStore } from '../../store/useAppStore'
import { streakFromDates } from '../../lib/quiz'
import {
  BarChart3,
  Bookmark,
  Flame,
  House,
  Layers,
  LayoutGrid,
  ListChecks,
  Library,
  Settings,
  Target,
  TrendingUp,
} from '../ui/icons'
import { DomainIcon } from '../ui/icons'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const wrongCount = useAppStore((state) => Object.keys(state.wrongBook).length)
  const favoriteCount = useAppStore((state) => state.favorites.length)
  const daily = useAppStore((state) => state.daily)
  const streak = streakFromDates(Object.keys(daily))

  return (
    <aside className={`sidebar${open ? ' open' : ''}`} aria-label="主导航">
      <NavLink to="/" className="brand" onClick={onClose}>
        <span className="brand-mark serif">题</span>
        <span className="brand-text">
          <span className="brand-name">题屿</span>
          <span className="brand-sub">TIYU BANK</span>
        </span>
      </NavLink>

      <nav className="nav-group">
        <span className="nav-label">学习</span>
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          onClick={onClose}
        >
          <House />
          学习台
        </NavLink>
        <NavLink
          to="/catalog"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          onClick={onClose}
        >
          <Library />
          题库总览
        </NavLink>
        <NavLink
          to="/wrong"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          onClick={onClose}
        >
          <Target />
          错题本
          {wrongCount > 0 ? <span className="nav-count">{wrongCount}</span> : null}
        </NavLink>
        <NavLink
          to="/favorites"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          onClick={onClose}
        >
          <Bookmark />
          我的收藏
          {favoriteCount > 0 ? <span className="nav-count">{favoriteCount}</span> : null}
        </NavLink>
        <NavLink
          to="/stats"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          onClick={onClose}
        >
          <BarChart3 />
          学习统计
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          onClick={onClose}
        >
          <ListChecks />
          练习记录
        </NavLink>
      </nav>

      <div className="nav-group">
        <span className="nav-label">分类</span>
        <div className="domain-nav">
          {domains.map((domain) => {
            const count = collections.filter((item) => item.domainId === domain.id).length
            return (
              <NavLink
                key={domain.id}
                to={`/domain/${domain.id}`}
                className={({ isActive }) => `domain-link${isActive ? ' active' : ''}`}
                onClick={onClose}
              >
                <DomainIcon name={domain.icon} />
                <span>{domain.name}</span>
                <span className="domain-index" style={{ marginLeft: 'auto' }}>
                  {count}
                </span>
              </NavLink>
            )
          })}
        </div>
      </div>

      <div className="sidebar-foot">
        <div className="streak-card">
          <span className="streak-flame">
            <Flame />
          </span>
          <span className="streak-text">
            <strong>{streak > 0 ? `${streak} 天连续练习` : '今天开始打卡'}</strong>
            <span>{streak > 0 ? '保持节奏，别断档' : '完成一组题即可点亮'}</span>
          </span>
        </div>
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          onClick={onClose}
        >
          <Settings />
          设置
        </NavLink>
        <p className="sidebar-note">
          <Layers style={{ width: 11, height: 11, verticalAlign: '-1px' }} /> 题库持续扩充中 ·
          本地离线可用
        </p>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const { pathname } = useLocation()
  const items = [
    { to: '/', label: '学习台', icon: House, match: pathname === '/' },
    { to: '/catalog', label: '题库', icon: LayoutGrid, match: pathname.startsWith('/catalog') || pathname.startsWith('/domain') },
    { to: '/wrong', label: '错题本', icon: Target, match: pathname.startsWith('/wrong') },
    { to: '/stats', label: '统计', icon: TrendingUp, match: pathname.startsWith('/stats') },
  ]
  return (
    <nav className="mobile-nav" aria-label="移动端导航">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={`mobile-nav-item${item.match ? ' active' : ''}`}
        >
          <item.icon />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
