import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const Layout = () => {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navItems = [
    { path: '/', label: 'Overview', icon: 'bi-diagram-3' },
    { path: '/powermeter', label: 'Powermeter', icon: 'bi-lightning-charge' },
    { path: '/environment', label: 'Environment', icon: 'bi-thermometer-sun' },
    { path: '/inverter', label: 'Inverter', icon: 'bi-grid-3x3-gap' },
  ]

  return (
    <div className="d-flex min-vh-100">
      {/* Sidebar */}
      <div
        className={`sidebar bg-dark text-white d-flex flex-column ${
          sidebarCollapsed ? 'collapsed' : ''
        }`}
        style={{
          width: sidebarCollapsed ? '80px' : '250px',
          transition: 'width 0.3s ease',
          minHeight: '100vh',
        }}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-bottom border-secondary">
          <div className="d-flex align-items-center justify-content-between">
            {!sidebarCollapsed && (
              <Link
                to="/"
                className="text-white text-decoration-none d-flex align-items-center"
              >
                <i className="bi bi-sun fs-4 me-2"></i>
                <span className="fw-bold text-nowrap">Solar Power</span>
              </Link>
            )}
            {sidebarCollapsed && (
              <Link to="/" className="text-white text-decoration-none mx-auto">
                <i className="bi bi-sun fs-4"></i>
              </Link>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-grow-1 p-3">
          <ul className="nav flex-column gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <li className="nav-item" key={item.path}>
                  <Link
                    className={`nav-link text-white d-flex align-items-center rounded ${
                      isActive ? 'bg-primary' : ''
                    } ${sidebarCollapsed ? 'justify-content-center' : ''}`}
                    to={item.path}
                    style={{
                      padding: '12px 16px',
                      transition: 'background-color 0.2s',
                    }}
                    title={sidebarCollapsed ? item.label : ''}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = '#495057'
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = ''
                    }}
                  >
                    <i className={`bi ${item.icon} fs-5`}></i>
                    {!sidebarCollapsed && <span className="ms-3">{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Collapse Button */}
        <div className="p-3 border-top border-secondary">
          <button
            className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <i
              className={`bi ${
                sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'
              } fs-5`}
            ></i>
            {!sidebarCollapsed && <span className="ms-2">Collapse</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-bottom">
          <div className="container py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0 text-primary">
                <i className="bi bi-speedometer2 me-2"></i>
                Solar Power Monitoring Dashboard
              </h4>
              <div className="d-flex align-items-center gap-3">
                <span className="badge bg-success">
                  <i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i>
                  System Online
                </span>
                <small className="text-muted">
                  <i className="bi bi-clock me-1"></i>
                  {new Date().toLocaleTimeString()}
                </small>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow-1 bg-light p-4">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-dark text-white text-center py-2">
          <small>© 2025 Solar Power Monitoring System</small>
        </footer>
      </div>
    </div>
  )
}

export default Layout
