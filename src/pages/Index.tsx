import { Link } from 'react-router-dom'

export function Index() {
  return (
    <div className="card">
      <h1>UnbeatenBascal</h1>
      <p>Hello World!</p>
      <nav style={{ marginTop: '1rem' }}>
        <Link to="/test1" style={{ marginRight: '1rem' }}>Go to Test Page 1</Link>
        <Link to="/">Back to Home</Link>
      </nav>
    </div>
  )
}