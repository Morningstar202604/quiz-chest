import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { collections } from '../data/taxonomy'
import { totalQuestions } from '../data'
import { ArrowRight, Menu, Settings, Sun, Moon, RotateCcw, Upload } from '../components/ui/icons'

export function SettingsPage() {
  const settings = useAppStore((state) => state.settings)
  const setTheme = useAppStore((state) => state.setTheme)
  const setFontScale = useAppStore((state) => state.setFontScale)
  const setAutoNext = useAppStore((state) => state.setAutoNext)
  const setShowSampleBanks = useAppStore((state) => state.setShowSampleBanks)
  const bankCount = useAppStore((state) => state.banks.length)
  const resetProgress = useAppStore((state) => state.resetProgress)
  const favorites = useAppStore((state) => state.favorites)
  const wrongBook = useAppStore((state) => state.wrongBook)
  const history = useAppStore((state) => state.history)

  return (
    <div className="settings-page">
      <header className="page-head">
        <span className="eyebrow">设置</span>
        <h1 className="page-title serif">按你的习惯调整</h1>
        <p className="page-sub">所有设置保存在本机浏览器，不涉及账号与云端同步。</p>
      </header>

      <section className="settings-group">
        <div className="settings-group-head">
          <h2 className="serif">外观</h2>
          <span>主题与阅读大小</span>
        </div>
        <div className="settings-row">
          <div>
            <strong>主题</strong>
            <p>浅色为纸张质感，深色适合夜间刷题。</p>
          </div>
          <div className="segmented">
            <button
              className={settings.theme === 'light' ? 'active' : ''}
              onClick={() => setTheme('light')}
            >
              <Sun /> 浅色
            </button>
            <button
              className={settings.theme === 'dark' ? 'active' : ''}
              onClick={() => setTheme('dark')}
            >
              <Moon /> 深色
            </button>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <strong>字号</strong>
            <p>放大题干与解析文字，减少长时间阅读疲劳。</p>
          </div>
          <div className="segmented">
            <button
              className={settings.fontScale === 'normal' ? 'active' : ''}
              onClick={() => setFontScale('normal')}
            >
              标准
            </button>
            <button
              className={settings.fontScale === 'large' ? 'active' : ''}
              onClick={() => setFontScale('large')}
            >
              大号
            </button>
          </div>
        </div>
      </section>

      <section className="settings-group">
        <div className="settings-group-head">
          <h2 className="serif">答题</h2>
          <span>练习时的行为</span>
        </div>
        <div className="settings-row">
          <div>
            <strong>自动跳转下一题</strong>
            <p>练习模式下答对后自动进入下一题，适合快速过题。</p>
          </div>
          <button
            role="switch"
            aria-checked={settings.autoNext}
            className={`switch${settings.autoNext ? ' on' : ''}`}
            onClick={() => setAutoNext(!settings.autoNext)}
          >
            <span />
          </button>
        </div>
      </section>

      <section className="settings-group">
        <div className="settings-group-head">
          <h2 className="serif">题库</h2>
          <span>内容来源</span>
        </div>
        <div className="settings-row">
          <div>
            <strong>显示示例题库</strong>
            <p>
              内置的 32 个示例题库每个只有 6-7 题，仅演示产品结构。关闭后题库总览只显示你导入的题库。
            </p>
          </div>
          <button
            role="switch"
            aria-checked={settings.showSampleBanks}
            className={`switch${settings.showSampleBanks ? ' on' : ''}`}
            onClick={() => setShowSampleBanks(!settings.showSampleBanks)}
          >
            <span />
          </button>
        </div>
        <div className="settings-row">
          <div>
            <strong>导入题库</strong>
            <p>
              当前已导入 {bankCount} 个题库。支持 JSON / CSV，逐行校验后保存在本机。
            </p>
          </div>
          <Link to="/import" className="button button-ghost button-sm">
            <Upload /> 去导入
          </Link>
        </div>
      </section>

      <section className="settings-group">
        <div className="settings-group-head">
          <h2 className="serif">数据</h2>
          <span>保存在本机</span>
        </div>
        <div className="settings-data">
          <div>
            <strong className="mono">{bankCount}</strong>
            <span>导入题库</span>
          </div>
          <div>
            <strong className="mono">{collections.length}</strong>
            <span>示例题库</span>
          </div>
          <div>
            <strong className="mono">{totalQuestions}</strong>
            <span>示例题目</span>
          </div>
          <div>
            <strong className="mono">{favorites.length}</strong>
            <span>收藏</span>
          </div>
          <div>
            <strong className="mono">{Object.keys(wrongBook).length}</strong>
            <span>错题</span>
          </div>
          <div>
            <strong className="mono">{history.length}</strong>
            <span>练习记录</span>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <strong>重置学习数据</strong>
            <p>清空收藏、错题、练习记录与每日统计，设置保持不变。</p>
          </div>
          <button
            className="button button-ghost button-sm"
            onClick={() => {
              if (window.confirm('确定重置全部学习数据？该操作不可撤销。')) resetProgress()
            }}
          >
            <RotateCcw /> 重置
          </button>
        </div>
      </section>

      <section className="settings-group about-group">
        <div className="settings-group-head">
          <h2 className="serif">关于题屿</h2>
          <span>版本 1.0.0</span>
        </div>
        <p className="about-copy">
          题屿是一个跨端刷题应用：同一份 React + TypeScript 代码可在浏览器、桌面（Tauri）
          与安卓（Capacitor）中运行。题库按七大领域、32 个题库组织，离线优先，数据留在本机。
        </p>
        <div className="about-links">
          <Link to="/catalog" className="text-link">
            浏览题库 <ArrowRight />
          </Link>
          <span className="about-tech">
            <Menu /> React 19 · Vite · TypeScript
          </span>
        </div>
      </section>

      <div className="settings-note">
        <Settings /> 跨端打包步骤见项目 docs/CROSS_PLATFORM.md
      </div>
    </div>
  )
}
