import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Powermeter from './pages/Powermeter'
import Environment from './pages/Environment'
import Inverter from './pages/Inverter'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="overview" element={<Overview />} />
        <Route path="powermeter" element={<Powermeter />} />
        <Route path="environment" element={<Environment />} />
        <Route path="inverter" element={<Inverter />} />
      </Route>
    </Routes>
  )
}

export default App
