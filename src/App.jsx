import { Routes, Route } from 'react-router-dom'
import ProjectList from './components/ProjectList'
import ProjectDetail from './components/ProjectDetail'

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
      </Routes>
    </div>
  )
}
