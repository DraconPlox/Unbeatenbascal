import { Link } from 'react-router-dom'

export function Index() {
  return (
    <div className="card">
      <h1>UnbeatenBascal</h1>
      <p>Hello World!</p>
      <nav style={{ marginTop: '1rem' }}>
        <Link to="/niveles">Ir a Niveles</Link>
      </nav>
    </div>
  )
}