import { useState } from 'react'

function ClinicalResources({ exerciseName }) {
    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [loaded, setLoaded] = useState(false)

    const fetchResources = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch('http://localhost:8000/api/research/resources', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: exerciseName })
            })

            if (!response.ok) throw new Error('Failed to fetch resources')

            const data = await response.json()
            setResources(data.resources || [])
            setLoaded(true)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const getSourceColor = (source) => {
        switch (source) {
            case 'NICE': return '#005eb8' // NHS Blue-ish
            case 'NHS': return '#005eb8'
            case 'CSP': return '#e40046' // CSP Red-ish
            default: return '#6b7280'
        }
    }

    if (!loaded && !loading) {
        return (
            <div style={{
                marginTop: '20px',
                textAlign: 'center'
            }}>
                <button
                    onClick={fetchResources}
                    className="btn"
                    style={{
                        background: 'linear-gradient(135deg, #005eb8 0%, #003087 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    <span>🏥</span> Find Accredited Clinical Resources
                </button>
                <p style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
                    Search NICE, NHS, and CSP for guidelines
                </p>
            </div>
        )
    }

    return (
        <div style={{
            background: 'rgba(0, 94, 184, 0.1)', // Light blue tint
            border: '2px solid rgba(0, 94, 184, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '20px'
        }}>
            <h3 style={{
                color: '#60a5fa',
                fontSize: '1.1rem',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                🏥 Clinical Resources & Guidelines
            </h3>

            {loading && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 10px', width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#60a5fa' }}></div>
                    Searching accredited sources...
                </div>
            )}

            {error && (
                <div style={{ color: '#ef4444', textAlign: 'center', padding: '10px' }}>
                    {error}. Please try again later.
                </div>
            )}

            {!loading && !error && resources.length === 0 && (
                <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', padding: '10px' }}>
                    No specific guidelines found for this exercise.
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {resources.map((res, index) => (
                    <a
                        key={index}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${getSourceColor(res.source)}40`, // 40 = 25% opacity hex
                            borderRadius: '8px',
                            padding: '12px 15px',
                            textDecoration: 'none',
                            color: 'white',
                            transition: 'all 0.2s ease',
                            display: 'block',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                            e.currentTarget.style.transform = 'translateX(5px)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                            e.currentTarget.style.transform = 'translateX(0)'
                        }}
                    >
                        {/* Source Badge */}
                        <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: getSourceColor(res.source),
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            padding: '2px 8px',
                            borderRadius: '4px'
                        }}>
                            {res.source}
                        </div>

                        <div style={{
                            fontWeight: '600',
                            marginBottom: '5px',
                            color: '#fff',
                            fontSize: '0.95rem',
                            lineHeight: '1.4',
                            paddingRight: '60px' // Space for badge
                        }}>
                            {res.title}
                        </div>

                        {res.summary && (
                            <div style={{
                                fontSize: '0.85rem',
                                color: 'rgba(255, 255, 255, 0.7)',
                                marginBottom: '8px',
                                lineHeight: '1.4'
                            }}>
                                {res.summary}
                            </div>
                        )}

                        <div style={{
                            fontSize: '0.75rem',
                            color: getSourceColor(res.source),
                            marginTop: '5px',
                            fontWeight: '500'
                        }}>
                            🔗 Visit {res.source} →
                        </div>
                    </a>
                ))}
            </div>
        </div>
    )
}

export default ClinicalResources
