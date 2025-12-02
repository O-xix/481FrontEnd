import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import StateMap from './pages/StateMap'
import SimulationMap from './pages/SimulationMap'
import Dashboard from './components/Dashboard/Dashboard'
import Navbar from './components/Navbar/Navbar'
import Home from './pages/Home'
import About from './pages/About'
import TableView from './components/TableView/TableView';

function App() {
  return (
    <Router>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<StateMap />} />
          <Route path="/simulation" element={<SimulationMap />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/TableView" element={<TableView />} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
