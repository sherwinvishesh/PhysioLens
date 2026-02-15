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
      background: 'rgba(59, 130, 246, 0.1)',
      border: '2px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '20px'
    }}>
      <h3 style={{ 
        color: '#3b82f6', 
        fontSize: '1.1rem', 
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
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
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              padding: '12px 15px',
              textDecoration: 'none',
              color: 'white',
              transition: 'all 0.2s ease',
              display: 'block'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
              e.currentTarget.style.transform = 'translateX(5px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            <div style={{ 
              fontWeight: '600', 
              marginBottom: '5px',
              color: '#60a5fa',
              fontSize: '0.95rem',
              lineHeight: '1.4'
            }}>
              {index + 1}. {ref.title}
            </div>
            <div style={{ 
              fontSize: '0.85rem', 
              color: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <span>{ref.authors}</span>
              {ref.source && <span>• {ref.source}</span>}
              {ref.pubdate && <span>• {ref.pubdate}</span>}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(59, 130, 246, 0.8)',
              marginTop: '5px'
            }}>
              🔗 View on PubMed →
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

export default References