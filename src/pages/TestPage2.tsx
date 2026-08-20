import { Link } from 'react-router-dom'

export function TestPage2() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Test Page 2</h1>
      <p>URL: /test2</p>
      <nav style={{ marginTop: '1rem' }}>
        <Link to="/test1" style={{ marginRight: '1rem' }}>Go to Test Page 1</Link>
        <Link to="/">Back to Home</Link>
      </nav>
    </div>
  )
}