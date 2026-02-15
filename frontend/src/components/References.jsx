/**
 * References Component
 * Displays research paper references with clickable links
 */

function References({ references, title = "📚 Research References" }) {
  if (!references || references.length === 0) {
    return null
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '24px',
      marginTop: '32px'
    }}>
      <h3 style={{
        color: 'white',
        fontSize: '1.1rem',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontWeight: 600
      }}>
        {title}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {references.map((ref, index) => (
          <a
            key={ref.pmid || index}
            href={ref.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '16px',
              textDecoration: 'none',
              color: 'white',
              transition: 'all 0.2s ease',
              display: 'block'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{
              fontWeight: '600',
              marginBottom: '8px',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.95rem',
              lineHeight: '1.5'
            }}>
              {index + 1}. {ref.title}
            </div>

            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '8px',
              lineHeight: '1.4'
            }}>
              {ref.authors}
            </div>

            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.4)',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              {ref.source && <span>{ref.source}</span>}
              {ref.pubdate && <span>{ref.pubdate}</span>}
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255, 255, 255, 0.8)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                Read Source
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

export default References