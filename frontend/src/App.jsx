// frontend/src/App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { MeetingModeProvider } from './contexts/MeetingModeContext'
import MeetingModeIndicator from './components/MeetingModeIndicator'
import EmergencyAlert from './components/EmergencyAlert'
import MeetingSchedulePopup from './components/MeetingSchedulePopup'
import LandingPage from './pages/LandingPage'
import DoctorView from './pages/DoctorView'
import PatientView from './pages/PatientView'
import ExerciseDetail from './pages/ExerciseDetail'
import ExerciseSession from './pages/ExerciseSession'
import SessionHistory from './pages/SessionHistory'
import AddExercise from './pages/AddExercise'
import UpcomingMeetings from './pages/UpcomingMeetings'
import ClinicalNotes from './pages/ClinicalNotes'

function App() {
  return (
    <MeetingModeProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <MeetingModeIndicator />
        <EmergencyAlert />
        <MeetingSchedulePopup />
        
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/doctor" element={<DoctorView />} />
          <Route path="/add-exercise" element={<AddExercise />} />
          <Route path="/patient" element={<PatientView />} />
          <Route path="/exercise/:exerciseId" element={<ExerciseDetail />} />
          <Route path="/session/:exerciseId" element={<ExerciseSession />} />
          <Route path="/session-history" element={<SessionHistory />} />
          <Route path="/upcoming-meetings" element={<UpcomingMeetings />} />
          <Route path="/clinical-notes" element={<ClinicalNotes />} />
        </Routes>
      </Router>
    </MeetingModeProvider>
  )
}

export default App