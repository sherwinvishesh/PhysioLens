import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DoctorView from './pages/DoctorView'
import PatientView from './pages/PatientView'
import ExerciseDetail from './pages/ExerciseDetail'
import ExerciseSession from './pages/ExerciseSession'
import SessionHistory from './pages/SessionHistory'
import AddExercise from './pages/AddExercise'

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/doctor" element={<DoctorView />} />
        <Route path="/add-exercise" element={<AddExercise />} />
        <Route path="/patient" element={<PatientView />} />
        <Route path="/exercise/:exerciseId" element={<ExerciseDetail />} />
        <Route path="/session/:exerciseId" element={<ExerciseSession />} />
        <Route path="/session-history" element={<SessionHistory />} />
      </Routes>
    </Router>
  )
}

export default App