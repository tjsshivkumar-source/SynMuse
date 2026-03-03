import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import PersonaChat from './pages/PersonaChat'
import PanelChat from './pages/PanelChat'
import CreatePersona from './pages/CreatePersona'

function App() {
  return (
    <Router>
      <div className="flex w-full h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto p-8 px-10 bg-black">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/persona/:slug" element={<PersonaChat />} />
            <Route path="/panel/:slug" element={<PanelChat />} />
            <Route path="/create" element={<CreatePersona />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
