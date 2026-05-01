import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { path: "/community", icon: "🗺️", label: "Danh sách Map" },
    { path: "/community/history", icon: "📜", label: "Lịch sử" }
  ];

  const isActive = (path) => {
    if (path === "/community") {
      return location.pathname === "/community";
    }
    return location.pathname === path;
  };

  return (
    <aside style={{
      width: '250px',
      background: 'linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)',
      borderRight: '1px solid #e2e8f0',
      padding: '1.5rem 0',
      height: 'calc(100vh - 80px)',
      position: 'sticky',
      top: '80px',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        padding: '0 1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.3rem',
          fontWeight: '700',
          color: '#1a202c',
          margin: '0 0 0.5rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          Cộng đồng
        </h3>
        <p style={{
          fontSize: '0.85rem',
          color: '#718096',
          margin: 0
        }}>
          Khám phá và chia sẻ
        </p>
      </div>

      {/* Menu Items */}
      <nav>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0
        }}>
          {menuItems.map((item) => (
            <li key={item.path} style={{ marginBottom: '0.5rem' }}>
              <Link
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1.5rem',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: isActive(item.path) ? '#6366f1' : '#4a5568',
                  backgroundColor: isActive(item.path) ? '#eef2ff' : 'transparent',
                  borderLeft: isActive(item.path) ? '4px solid #6366f1' : '4px solid transparent',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = '#f7fafc';
                    e.currentTarget.style.paddingLeft = '1.75rem';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.paddingLeft = '1.5rem';
                  }
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Divider */}
      <div style={{
        height: '1px',
        background: '#e2e8f0',
        margin: '1.5rem 1rem'
      }}></div>

      {/* Stats Card */}
      <div style={{
        margin: '0 1.5rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        color: 'white'
      }}>
        <div style={{
          fontSize: '0.85rem',
          opacity: '0.9',
          marginBottom: '0.5rem'
        }}>
          Tổng Map đã chơi
        </div>
        <div style={{
          fontSize: '2rem',
          fontWeight: '700'
        }}>
          42
        </div>
        <div style={{
          fontSize: '0.8rem',
          opacity: '0.8',
          marginTop: '0.5rem'
        }}>
          Tiếp tục phát huy!
        </div>
      </div>
    </aside>
  );
}