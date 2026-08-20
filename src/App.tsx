import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="app">
      <div className="card">
        <h1>UnbeatenBascal</h1>

        <p>Hello World!</p>
      </div>
    </main>
  )
}

export default App