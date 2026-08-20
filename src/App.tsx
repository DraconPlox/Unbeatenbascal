import './App.css'
import { BrowserRouter, HashRouter, Routes, Route, Link } from 'react-router-dom'
import { Index } from './pages/Index'
import { TestPage1 } from './pages/TestPage1'
import { TestPage2 } from './pages/TestPage2'

const isProd = import.meta.env.PROD
const basename = isProd ? '/Unbeatenbascal' : '/'

function App() {
  if (isProd) {
    return (
      <HashRouter>
        <main className="app">
          <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
            <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
            <Link to="/test1" style={{ marginRight: '1rem' }}>Test 1</Link>
            <Link to="/test2">Test 2</Link>
          </nav>
          <Routes>
            <Route path="/" element={<Index />}/>      
            <Route path="/test1" element={<TestPage1 />} />
            <Route path="/test2" element={<TestPage2 />} />
          </Routes>
        </main>
      </HashRouter>
    )
  }

  return (
    <BrowserRouter basename={basename}>
      <main className="app">
        <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
          <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
          <Link to="/test1" style={{ marginRight: '1rem' }}>Test 1</Link>
          <Link to="/test2">Test 2</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Index />}/>      
          <Route path="/test1" element={<TestPage1 />} />
          <Route path="/test2" element={<TestPage2 />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App