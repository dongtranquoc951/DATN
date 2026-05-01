export default function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '2rem',
      marginTop: 'auto',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Logo và tên */}
        <div style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <span>🎮</span>
          CodeQuest
        </div>

        {/* Copyright */}
        <div style={{
          fontSize: '0.95rem',
          opacity: '0.9'
        }}>
          © 2026 CodeQuest. Made with ❤️ for learners
        </div>
      </div>
    </footer>
  );
}