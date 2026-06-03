import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const Layout = () => {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navItems = [
    { path: '/', label: 'Overview', icon: 'bi-columns-gap' },
    { path: '/powermeter', label: 'Powermeter', icon: 'bi-lightning-charge-fill' },
    { path: '/environment', label: 'Environment', icon: 'bi-cloud-sun-fill' },
    { path: '/inverter', label: 'Inverter', icon: 'bi-cpu-fill' },
  ]

  return (
    <div className="app-shell d-flex min-vh-100">
      <aside className={`modern-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="modern-brand">
          <Link to="/" className="modern-brand-link">
            <div className="modern-brand-logo">
              <i className="bi bi-sun-fill"></i>
            </div>

            {!sidebarCollapsed && (
              <div>
                <div className="modern-brand-title">Solar Power</div>
                <div className="modern-brand-subtitle">SCADA Dashboard</div>
              </div>
            )}
          </Link>
        </div>

        <nav className="modern-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                title={sidebarCollapsed ? item.label : ''}
                className={`modern-nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="modern-nav-icon">
                  <i className={`bi ${item.icon}`}></i>
                </div>

                {!sidebarCollapsed && <span>{item.label}</span>}

                {!sidebarCollapsed && isActive && (
                  <i className="bi bi-chevron-right modern-active-arrow"></i>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="modern-sidebar-bottom">
          <button
            className="modern-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i
              className={`bi ${
                sidebarCollapsed ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar-inset-reverse'
              }`}
            ></i>

            {!sidebarCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      <div className="modern-main flex-grow-1 d-flex flex-column">
        <header className="modern-header">
          <div>
            <h4>
              <i className="bi bi-activity me-2"></i>
              Solar Power Monitoring Dashboard
            </h4>
            <span>Real-time supervision and energy analytics</span>
          </div>

          <div className="modern-header-actions">
            <div className="modern-online-badge">
              <span></span>
              System Online
            </div>

            <div className="modern-time-box">
              <i className="bi bi-clock-history"></i>
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </header>

        <main className="modern-content flex-grow-1">
          <Outlet />
        </main>

        <footer className="modern-footer">
          <span>Solar Power Monitoring System</span>
          <strong>© 2026</strong>
        </footer>
      </div>
    </div>
  )
}

export default Layout