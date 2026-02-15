# PhysioLens : AI-Powered Physical Therapy Platform

## Overview

PhysioLens is a comprehensive AI-powered physical therapy platform that combines computer vision pose detection to deliver professional-grade rehabilitation at home. The system enables doctors to assign exercises to patients, tracks exercise performance in real-time, and generates clinical summaries using AI.

## Key Features

### Core Capabilities

- **AI-Powered Exercise Creation**: Doctors can create custom exercises by providing a description and optional image. Claude AI automatically generates:
  - Camera positioning requirements (upper body, full body, lower body)
  - Rep counting algorithms with angle thresholds
  - Step-by-step instructions
  - Form checks and safety warnings
  - Clinical research references from PubMed

- **Real-Time Pose Detection**: Uses MediaPipe for accurate skeletal tracking with:
  - Dual video feed (raw + skeleton overlay)
  - Automatic rep counting
  - Form deviation detection
  - Live angle measurements

- **Meeting Mode (Voice Coaching)**: 
  - Continuous voice transcription during sessions
  - Automatic emergency detection with instant alerts
  - Meeting/appointment scheduling detection
  - AI-generated clinical summaries after sessions

- **Comprehensive Session Analysis**:
  - Records video + pose data for later review
  - AI performance scoring (0-100)
  - Detailed biomechanical analysis detecting:
    - Tremor/instability
    - Compensation patterns
    - Speed variations
    - Range of motion issues
    - Form deviations
  - Clinical research integration via PubMed and BrightData web scraping

### 👨‍⚕️ Doctor Dashboard

- Browse and assign 5 built-in exercises + unlimited custom AI-generated exercises
- Set target reps for each patient
- Create custom exercises using Claude AI
- View assigned exercises and completion status

### 🏃‍♂️ Patient Interface

- View assigned exercises with instructions
- Start guided exercise sessions with:
  - 10-second countdown before rep counting begins
  - Real-time camera positioning guidance
  - Live rep counting and angle feedback
  - Optional video recording for analysis
- Review session history with AI performance insights
- Access clinical notes and scheduled meetings

### Analytics & Reporting

- **Session History**: 
  - Video playback with timestamp navigation
  - AI-generated performance scores
  - Detailed issue detection with severity levels
  - Research references from clinical literature

- **Clinical Notes**:
  - AI-generated session summaries
  - Patient mood and compliance tracking
  - Follow-up recommendations
  - Scheduled appointments

## Technology Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Google MediaPipe** for pose detection
  - `@mediapipe/pose` - Skeletal tracking
  - `@mediapipe/camera_utils` - Camera integration
  - `@mediapipe/drawing_utils` - Skeleton visualization

### Backend
- **FastAPI** (Python) - RESTful API
- **Claude AI (Anthropic)** - Exercise generation, analysis, and clinical summaries
- **PubMed API** - Medical research integration
- **BrightData Web MCP** - Clinical resource scraping (NICE, NHS, CSP, and more)
- **Web Speech API** - Voice transcription

### AI Integration
- Claude Sonnet 4 for:
  - Custom exercise configuration generation
  - Performance analysis and scoring
  - Clinical summary generation
  - Emergency/meeting detection from voice

## Project Structure

```
physiolens/
├── backend/
│   ├── main.py                           # FastAPI server
│   ├── services/
│   │   └── brightdata_service.py         # Web scraping for clinical resources
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/                   # React components
│   │   │   ├── CameraPositioning.jsx
│   │   │   ├── FormFeedback.jsx
│   │   │   ├── References.jsx
│   │   │   ├── ClinicalResources.jsx
│   │   │   ├── EmergencyAlert.jsx
│   │   │   └── MeetingSchedulePopup.jsx
│   │   ├── contexts/
│   │   │   └── MeetingModeContext.jsx    # Voice transcription state
│   │   ├── pages/                        # Main views
│   │   │   ├── LandingPage.jsx
│   │   │   ├── DoctorView.jsx
│   │   │   ├── PatientView.jsx
│   │   │   ├── AddExercise.jsx
│   │   │   ├── ExerciseDetail.jsx
│   │   │   ├── ExerciseSession.jsx
│   │   │   ├── SessionHistory.jsx
│   │   │   ├── ClinicalNotes.jsx
│   │   │   └── UpcomingMeetings.jsx
│   │   ├── utils/                       # Core algorithms
│   │   │   ├── exerciseConfigs.js       # Exercise configurations
│   │   │   ├── repCounters.js           # Rep counting logic
│   │   │   ├── formAnalysis.js          # Form checking
│   │   │   ├── poseUtils.js             # Angle calculations
│   │   │   └── advancedAnalysis.js      # Session analysis
│   │   ├── styles/
│   │   └── App.jsx
│   └── package.json
├── README.md
├── .gitignore
└── LICENCE
```

## Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+
- **Anthropic API Key** (for Claude AI)
- **BrightData API Token** (optional, for clinical resource scraping)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt --break-system-packages
```

4. Create `.env` file:
```env
ANTHROPIC_API_KEY=your_claude_api_key_here
BRIGHTDATA_WS_ENDPOINT=your_brightdata_endpoint
BRIGHTDATA_API_TOKEN=your_brightdata_token_here  
```

5. Run server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

4. Open browser to `http://localhost:5173`

## Usage Guide

### For Doctors

1. **Navigate to Doctor View** from landing page
2. **Assign Exercises**:
   - Select up to 5 exercises from the library
   - Set target reps for each exercise
   - Click "Assign Exercises"
3. **Create Custom Exercise** (optional):
   - Click "Add Custom Exercise"
   - Provide exercise name and detailed description
   - Optionally upload an image
   - Claude AI generates complete configuration (30s - 5min)
   - Review generated instructions and parameters

### For Patients

1. **Navigate to Patient View** from landing page
2. **Review Assigned Exercises**
3. **Start Exercise Session**:
   - Click on an exercise
   - Review instructions
   - Enable "Video Guided Session" for recording (optional)
   - Click "Start Exercise Session"
   - Position yourself within camera frame (guidance provided)
   - 10-second countdown before rep counting begins
   - Perform exercise - AI tracks reps and form
   - Click "Complete Session" when done
4. **Review History**:
   - View recorded sessions
   - Watch video playback
   - See AI performance analysis
   - Review clinical research references

### Meeting Mode (Voice Coaching)

1. **Enable Meeting Mode** on landing page
2. Voice recording starts automatically
3. System continuously monitors for:
   - Emergency keywords → Instant alert popup
   - Meeting scheduling → Auto-capture and confirm
4. After session, AI generates clinical summary
5. View summaries in "Clinical Notes"

## Built-in Exercises

1. **Bicep Curls** (ID: 3) - Upper body, intermediate
2. **Lateral Raises** (ID: 5) - Upper body, beginner
3. **Front Raises** (ID: 6) - Upper body, beginner
4. **Standing Leg Raises** (ID: 8) - Full body, beginner

## AI Analysis Features

### Performance Scoring (0-100)
- Reps completed vs target
- Form quality assessment
- Issue severity weighting
- Strengths and weaknesses identification
- Actionable recommendations

### Detected Issues
- **Tremor/Instability**: Joint shaking during movement
- **Opposite Hand Support**: Using non-working hand for assistance
- **Compensation Patterns**: Leaning, twisting, momentum use
- **Speed Variations**: Too fast or uncontrolled movements
- **Limited Range of Motion**: Not reaching full extension/flexion
- **Exercise-Specific**: Elbow drift, back arching, etc.

### Clinical Integration
- PubMed research references
- NICE/NHS/CSP guidelines (via BrightData)
- Evidence-based recommendations

## API Endpoints

### Exercise Management
- `GET /exercises` - List all exercises
- `POST /assign-exercises` - Assign exercises to patient
- `GET /assigned-exercises` - Get patient's assigned exercises
- `POST /api/create-exercise` - Create custom exercise with AI

### Session Recording
- `POST /save-recording-session` - Save completed session
- `GET /recorded-sessions` - List all sessions
- `GET /recorded-sessions/{id}` - Get specific session
- `POST /api/claude-analysis` - Get AI performance analysis

### Meeting Mode
- `POST /api/meeting-mode/analyze-chunk` - Real-time voice analysis
- `POST /api/meeting-mode/generate-summary` - Generate clinical summary
- `POST /api/meetings/create` - Create scheduled meeting
- `GET /api/meetings/upcoming` - List upcoming meetings

### Research
- `POST /api/research/resources` - Search clinical resources

## Configuration

### Exercise Config Structure
```javascript
{
  name: "Exercise Name",
  cameraType: "upper_body" | "full_body" | "lower_body",
  repCounting: {
    type: "angle_based",
    landmarks: {
      point1: POSE_LANDMARKS.SHOULDER,
      point2: POSE_LANDMARKS.ELBOW,
      point3: POSE_LANDMARKS.WRIST
    },
    thresholds: {
      startAngle: 140,
      endAngle: 90,
      hysteresis: 15
    },
    phases: ["down", "up"]
  },
  formChecks: {
    stability: {
      enabled: true,
      maxMovement: 0.15,
      warning: "Keep your body stable"
    }
  }
}
```

## Browser Compatibility

- **Chrome/Edge** (recommended) - Full support including voice recognition
- **Firefox** - Pose detection works, voice features limited
- **Safari** - Pose detection works, voice features not supported

## Performance Notes

- Pose detection runs at ~30 FPS on modern hardware
- Rep counting has 15° hysteresis to prevent false triggers
- Form warnings have 8-second cooldown to avoid spam
- Video recording saves to browser localStorage (5MB limit per session)


## License

MIT License - see LICENSE file for details

## Acknowledgments

- **Anthropic** - Claude AI for exercise generation and analysis
- **Google MediaPipe** - Pose detection technology
- **PubMed/NCBI** - Medical research database
- **BrightData** - Web scraping infrastructure
- **OpenEvidence** - For empowering us to create innovative healthcare solutions
- **Zingage** - For supporting our journey in building impactful health technology products
- **Stanford TreeHacks** - For providing the opportunity to participate in this incredible hackathon and bring PhysioLens to life

---

**Built with ❤️ for accessible, AI-powered physical therapy**