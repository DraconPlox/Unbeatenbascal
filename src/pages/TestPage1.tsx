import { Link } from 'react-router-dom'

export function TestPage1() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Test Page 1</h1>
      <p>URL: /test1</p>
      <nav style={{ marginTop: '1rem' }}>
        <Link to="/test2" style={{ marginRight: '1rem' }}>Go to Test Page 2</Link>
        <Link to="/">Back to Home</Link>
      </nav>
    </div>
  )
}