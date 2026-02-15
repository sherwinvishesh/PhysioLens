import { useState, useEffect } from 'react'

function ClinicalResources({ exerciseName }) {
    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [loaded, setLoaded] = useState(false)

    // Reset state when exerciseName changes
    useEffect(() => {
        setResources([])
        setLoaded(false)
        setError(null)
        setLoading(false)
    }, [exerciseName])

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

    if (!loaded && !loading) {
        return (
            <div className="cr-empty-state">
                <button
                    onClick={fetchResources}
                    className="cr-find-btn"
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
        <div className="cr-container">
            <h3 className="cr-header">
                🏥 Clinical Resources & Guidelines
            </h3>

            {loading && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    <div style={{
                        margin: '0 auto 10px',
                        width: '24px',
                        height: '24px',
                        border: '3px solid rgba(255,255,255,0.1)',
                        borderTopColor: '#ffffff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
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

            <div className="cr-list">
                {resources.map((res, index) => (
                    <a
                        key={index}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cr-item"
                    >
                        {/* Source Badge */}
                        <div className="cr-badge">
                            {res.source}
                        </div>

                        <div className="cr-title">
                            {res.title}
                        </div>

                        {res.summary && (
                            <div className="cr-summary">
                                {res.summary}
                            </div>
                        )}

                        <div className="cr-link">
                            🔗 Visit {res.source} →
                        </div>
                    </a>
                ))}
            </div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

export default ClinicalResources
