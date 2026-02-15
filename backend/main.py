from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os
import base64
from dotenv import load_dotenv
import xml.etree.ElementTree as ET
from datetime import datetime
import json
from services.brightdata_service import BrightDataService

load_dotenv()

app = FastAPI(title="PhysioLens API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class Exercise(BaseModel):
    id: int
    name: str
    description: str
    instructions: List[str]
    duration: str
    difficulty: str

class ExerciseAssignment(BaseModel):
    exercise_id: int
    target_reps: int

class AssignExercisesRequest(BaseModel):
    assignments: List[ExerciseAssignment]

class AssignedExercise(BaseModel):
    id: int
    name: str
    description: str
    instructions: List[str]
    duration: str
    difficulty: str
    target_reps: int
    completed: bool = False

class WarningEvent(BaseModel):
    timestamp: float
    message: str
    severity: str

class RecordingSession(BaseModel):
    exercise_id: int
    exercise_name: str
    completed_at: str
    duration: int
    rep_count: int
    target_reps: int
    warnings: List[WarningEvent]

class AnalysisRequest(BaseModel):
    session_data: dict
    analysis_results: dict

class CreateExerciseRequest(BaseModel):
    name: str
    description: str
    image_base64: Optional[str] = None

class TranscriptAnalysis(BaseModel):
    transcript: str
    phase: str

class Meeting(BaseModel):
    id: Optional[int] = None
    scheduled_date: Optional[str] = None
    title: Optional[str] = None
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    extracted_phrase: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    created_at: Optional[str] = None

class TranscriptChunk(BaseModel):
    text: str

class SummaryRequest(BaseModel):
    transcript: str
    duration: int
    detectedMeetings: list
    detectedEmergencies: list
    sessionContext: dict

# In-memory storage
assigned_exercises = []
recorded_sessions = [] 
custom_exercises = []
meetings_db = []
next_exercise_id = 9
next_meeting_id = 1

# Built-in exercises
EXERCISES = [
    {
        "id": 3,
        "name": "Bicep Curls",
        "description": "Builds arm strength and muscle tone",
        "instructions": [
            "Stand with feet shoulder-width apart",
            "Hold a light weight in each hand, palms facing forward",
            "Keep elbows close to your body",
            "Slowly curl weights toward shoulders",
            "Pause at the top, then slowly lower",
            "Repeat for the target number of reps"
        ],
        "duration": "5-10 minutes",
        "difficulty": "Intermediate"
    },
    {
        "id": 4,
        "name": "Shoulder Press",
        "description": "Strengthens shoulders and upper arms",
        "instructions": [
            "Stand with feet shoulder-width apart",
            "Hold weights at shoulder level, elbows bent at 90 degrees",
            "Keep your core engaged and back straight",
            "Press weights straight up overhead",
            "Fully extend your arms at the top",
            "Lower back to starting position with control"
        ],
        "duration": "5-10 minutes",
        "difficulty": "Intermediate"
    },
    {
        "id": 5,
        "name": "Lateral Raises",
        "description": "Targets shoulder muscles for better definition",
        "instructions": [
            "Stand with feet hip-width apart",
            "Hold light weights at your sides, palms facing inward",
            "Keep a slight bend in your elbows",
            "Raise arms out to the sides until shoulder height",
            "Pause briefly at the top",
            "Lower back down slowly and with control"
        ],
        "duration": "5-8 minutes",
        "difficulty": "Beginner"
    },
    {
        "id": 6,
        "name": "Front Raises",
        "description": "Builds front shoulder strength and stability",
        "instructions": [
            "Stand with feet shoulder-width apart",
            "Hold weights in front of thighs, palms facing down",
            "Keep arms mostly straight with slight elbow bend",
            "Raise weights forward to shoulder level",
            "Keep your core tight and avoid leaning back",
            "Lower weights back down with control"
        ],
        "duration": "5-8 minutes",
        "difficulty": "Beginner"
    },
    {
        "id": 8,
        "name": "Standing Leg Raises",
        "description": "Strengthens hip flexors and improves balance",
        "instructions": [
            "Stand tall with feet together",
            "Hold onto a chair or wall for balance if needed",
            "Keep your standing leg slightly bent",
            "Raise one leg forward to about hip height",
            "Keep your leg straight and core engaged",
            "Lower leg back down with control and repeat"
        ],
        "duration": "5-10 minutes",
        "difficulty": "Beginner"
    }
]

# PubMed API Helper Functions
async def search_pubmed(query: str, max_results: int = 5):
    """Search PubMed for research papers"""
    base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    
    params = {
        "db": "pubmed",
        "term": query,
        "retmax": max_results,
        "retmode": "json",
        "sort": "relevance"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(base_url, params=params, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                ids = data.get("esearchresult", {}).get("idlist", [])
                return ids
            return []
    except Exception as e:
        print(f"PubMed search error: {e}")
        return []

async def fetch_pubmed_details(pmids: List[str]):
    """Fetch paper details from PubMed"""
    if not pmids:
        return []
    
    base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    
    params = {
        "db": "pubmed",
        "id": ",".join(pmids),
        "retmode": "json"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(base_url, params=params, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                results = []
                
                for pmid in pmids:
                    if pmid in data.get("result", {}):
                        paper = data["result"][pmid]
                        results.append({
                            "pmid": pmid,
                            "title": paper.get("title", ""),
                            "authors": paper.get("authors", [{}])[0].get("name", "Unknown") if paper.get("authors") else "Unknown",
                            "source": paper.get("source", ""),
                            "pubdate": paper.get("pubdate", ""),
                            "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
                        })
                
                return results
            return []
    except Exception as e:
        print(f"PubMed fetch error: {e}")
        return []

async def get_exercise_references(exercise_name: str, description: str):
    """Get relevant research references for an exercise"""
    query = f"({exercise_name}) AND (physical therapy OR rehabilitation OR exercise therapy)"
    pmids = await search_pubmed(query, max_results=3)
    references = await fetch_pubmed_details(pmids)
    return references

@app.get("/")
def read_root():
    return {"message": "PhysioLens API is running!"}

@app.get("/exercises")
def get_all_exercises():
    """Get list of all available exercises"""
    all_exercises = EXERCISES + custom_exercises
    return {"exercises": all_exercises}

@app.post("/assign-exercises")
def assign_exercises(request: AssignExercisesRequest):
    """Doctor assigns exercises with target reps to patient"""
    global assigned_exercises
    
    if len(request.assignments) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 exercises can be assigned")
    
    if len(request.assignments) == 0:
        raise HTTPException(status_code=400, detail="At least 1 exercise must be assigned")
    
    all_exercises = EXERCISES + custom_exercises
    
    valid_ids = [ex["id"] for ex in all_exercises]
    for assignment in request.assignments:
        if assignment.exercise_id not in valid_ids:
            raise HTTPException(status_code=400, detail=f"Exercise ID {assignment.exercise_id} not found")
        if assignment.target_reps <= 0:
            raise HTTPException(status_code=400, detail=f"Target reps must be greater than 0")
    
    # Do not clear existing exercises - append or update instead
    for assignment in request.assignments:
        # Check if exercise is already assigned
        existing_exercise = next((ex for ex in assigned_exercises if ex["id"] == assignment.exercise_id), None)
        
        if existing_exercise:
            # Update existing assignment
            existing_exercise["target_reps"] = assignment.target_reps
            existing_exercise["completed"] = False
        else:
            # Add new assignment
            exercise = next(ex for ex in all_exercises if ex["id"] == assignment.exercise_id)
            assigned_exercises.append({
                **exercise,
                "target_reps": assignment.target_reps,
                "completed": False
            })
    
    return {
        "message": "Exercises assigned successfully",
        "assigned_count": len(assigned_exercises),
        "exercises": assigned_exercises
    }

@app.get("/assigned-exercises")
def get_assigned_exercises():
    """Patient views their assigned exercises"""
    return {"exercises": assigned_exercises}

@app.post("/complete-exercise/{exercise_id}")
def complete_exercise(exercise_id: int):
    """Mark an exercise as completed"""
    global assigned_exercises
    
    for exercise in assigned_exercises:
        if exercise["id"] == exercise_id:
            exercise["completed"] = True
            return {"message": "Exercise marked as completed", "exercise": exercise}
    
    raise HTTPException(status_code=404, detail="Exercise not found")

@app.post("/save-recording-session")
def save_recording_session(session: RecordingSession):
    """Save a recorded exercise session with warnings"""
    session_data = session.dict()
    session_data['id'] = len(recorded_sessions) + 1
    recorded_sessions.append(session_data)
    
    return {
        "message": "Recording session saved successfully",
        "session_id": session_data['id']
    }

@app.get("/recorded-sessions")
def get_recorded_sessions():
    """Get all recorded sessions"""
    return {"sessions": recorded_sessions}

@app.get("/recorded-sessions/{session_id}")
def get_recorded_session(session_id: int):
    """Get a specific recorded session"""
    for session in recorded_sessions:
        if session['id'] == session_id:
            return {"session": session}
    
    raise HTTPException(status_code=404, detail="Session not found")

@app.post("/api/claude-analysis")
async def get_claude_analysis(request: AnalysisRequest):
    """Proxy endpoint for Claude API with PubMed references"""
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Claude API key not configured on server")
    
    session = request.session_data
    analysis = request.analysis_results
    
    # Get PubMed references for this exercise
    references = await get_exercise_references(session['exercise_name'], "exercise performance analysis")
    
    # Build references text for Claude
    references_text = ""
    if references:
        references_text = "\n\n**Available Research References:**\n"
        for i, ref in enumerate(references, 1):
            references_text += f"{i}. {ref['title']} - {ref['authors']} ({ref['pubdate']})\n"
    
    prompt = f"""You are an expert physical therapist analyzing a patient's exercise session. Be encouraging and realistic - minor form issues are normal and expected during physical therapy.

**Session Details:**
- Exercise: {session['exercise_name']}
- Duration: {session['duration'] // 60}m {session['duration'] % 60}s
- Reps Completed: {session['rep_count']} / {session['target_reps']}
- Total Issues Detected: {analysis['totalIssues']}

**Issues Breakdown by Severity:**
- High Severity: {analysis['summary']['bySeverity']['high']} (most important - affects safety)
- Medium Severity: {analysis['summary']['bySeverity']['medium']} (moderate concern)
- Low Severity: {analysis['summary']['bySeverity']['low']} (minor optimization opportunities)

**Issues by Type:**
{chr(10).join([f"- {t.replace('_', ' ')}: {c}" for t, c in analysis['summary']['byType'].items()])}

**Sample Issues (first 10):**
{chr(10).join([f"[{int(issue['timestamp'])}s] {issue['message']}" for issue in analysis['issues'][:10]])}
{references_text}

**Scoring Guidelines:**
- Completing target reps: Strong baseline (70+)
- 0-2 high severity issues: 75-90
- 3-5 medium severity issues: 70-85
- Low severity issues: -1 to -3 points each
- High severity issues: -5 to -10 points each
- Perfect form is rare - 80-85 is excellent for most patients
- Focus on progress and encouragement

Provide your analysis in this JSON format (respond with ONLY valid JSON, no markdown, no code blocks):
{{
  "overallScore": 75,
  "formQuality": "good",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "summary": "2-3 sentence overall summary"
}}"""
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1500,
                    "messages": [{
                        "role": "user",
                        "content": prompt
                    }]
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Claude API error: {response.text}"
                )
            
            data = response.json()
            text_content = data['content'][0]['text']
            
            cleaned = text_content.strip()
            if cleaned.startswith('```json'):
                cleaned = cleaned.replace('```json\n', '').replace('\n```', '')
            elif cleaned.startswith('```'):
                cleaned = cleaned.replace('```\n', '').replace('\n```', '')
            
            return {
                "analysis": cleaned,
                "references": references
            }
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Claude API timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling Claude API: {str(e)}")

@app.post("/api/create-exercise")
async def create_exercise(request: CreateExerciseRequest):
    """Use Claude to analyze exercise and generate configuration with PubMed references"""
    global next_exercise_id, custom_exercises
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Claude API key not configured on server")
    
    # Get PubMed references for this exercise
    references = await get_exercise_references(request.name, request.description)
    
    # Build references text for Claude
    references_text = ""
    if references:
        references_text = "\n\n**Research References Found:**\n"
        for i, ref in enumerate(references, 1):
            references_text += f"{i}. {ref['title']} - {ref['authors']} ({ref['pubdate']})\n"
        references_text += "\nUse these references to inform your exercise configuration if relevant.\n"
    
    prompt = f"""You are a physical therapy and biomechanics expert. Analyze this exercise and create a complete configuration for a computer vision-based tracking system.

**Exercise Name:** {request.name}
**Exercise Description:** {request.description}
{references_text}

Based on this exercise, generate a complete configuration that includes:

1. **Camera Setup:** Determine if this requires 'upper_body', 'full_body', or 'lower_body' camera view
2. **Key Body Landmarks:** Identify the 3 most important joint landmarks for tracking this movement
3. **Rep Counting:** Define angle thresholds for counting reps (be LENIENT - allow 15-25 degree variance for real-world use)
4. **Instructions:** Create 6 clear, step-by-step instructions
5. **Difficulty & Duration:** Assess difficulty level and typical duration

**Important Guidelines:**
- Make thresholds LENIENT and PRACTICAL (like bicep curls: 140° start, 90° end with ±15° tolerance)
- Use realistic angles that account for individual variation
- Angle thresholds should have 15-25 degree hysteresis to prevent false counting
- Instructions should be clear and actionable
- Think about what makes this exercise effective vs. perfect form

**Available Landmarks (use these exact names):**
- Upper body: NOSE, LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_ELBOW, RIGHT_ELBOW, LEFT_WRIST, RIGHT_WRIST, LEFT_HIP, RIGHT_HIP
- Full body: All above + LEFT_KNEE, RIGHT_KNEE, LEFT_ANKLE, RIGHT_ANKLE
- Lower body: LEFT_HIP, RIGHT_HIP, LEFT_KNEE, RIGHT_KNEE, LEFT_ANKLE, RIGHT_ANKLE

Respond with ONLY valid JSON (no markdown, no code blocks):
{{
  "cameraType": "upper_body",
  "difficulty": "Beginner",
  "duration": "5-10 minutes",
  "instructions": ["step 1", "step 2", "step 3", "step 4", "step 5", "step 6"],
  "repCounting": {{
    "type": "angle_based",
    "landmarks": {{
      "point1": "RIGHT_SHOULDER",
      "point2": "RIGHT_ELBOW",
      "point3": "RIGHT_WRIST"
    }},
    "thresholds": {{
      "startAngle": 140,
      "endAngle": 90,
      "hysteresis": 15
    }},
    "phases": ["down", "up"]
  }},
  "formChecks": {{
    "check1": {{
      "enabled": true,
      "type": "stability",
      "maxMovement": 0.15,
      "warning": "Keep your body stable"
    }}
  }}
}}"""
    
    try:
        messages = [{
            "role": "user",
            "content": prompt if not request.image_base64 else [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": request.image_base64
                    }
                },
                {
                    "type": "text",
                    "text": prompt
                }
            ]
        }]
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 2000,
                    "messages": messages
                },
                timeout=120.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Claude API error: {response.text}"
                )
            
            data = response.json()
            text_content = data['content'][0]['text']
            
            cleaned = text_content.strip()
            if cleaned.startswith('```json'):
                cleaned = cleaned.replace('```json\n', '').replace('\n```', '')
            elif cleaned.startswith('```'):
                cleaned = cleaned.replace('```\n', '').replace('\n```', '')
            
            config = json.loads(cleaned)
            
            new_exercise = {
                "id": next_exercise_id,
                "name": request.name,
                "description": request.description,
                "instructions": config["instructions"],
                "duration": config["duration"],
                "difficulty": config["difficulty"],
                "config": config,
                "references": references
            }
            
            custom_exercises.append(new_exercise)
            next_exercise_id += 1
            
            return {
                "message": "Exercise created successfully",
                "exercise": new_exercise
            }
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Claude API timeout")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from Claude: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating exercise: {str(e)}")

@app.get("/custom-exercises")
def get_custom_exercises():
    """Get all custom exercises created by doctors"""
    return {"exercises": custom_exercises}

@app.get("/exercise-config/{exercise_id}")
def get_exercise_config(exercise_id: int):
    """Get configuration for a specific exercise"""
    for exercise in custom_exercises:
        if exercise["id"] == exercise_id:
            return {"config": exercise.get("config")}
    
    raise HTTPException(status_code=404, detail="Exercise configuration not found")

@app.post("/api/research/resources")
async def get_clinical_resources(request: dict):
    """Search for clinical resources (NICE, NHS, CSP)"""
    query = request.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter required")
    
    try:
        service = BrightDataService()
        results = await service.search_clinical_resources(query)
        return {"resources": results}
    except Exception as e:
        print(f"Error fetching resources: {e}")
        # Return empty list on error to avoid breaking frontend
        return {"resources": [], "error": str(e)}

# ==========================================
# MEETING MODE ENDPOINTS
# ==========================================

@app.post("/api/meeting-mode/analyze-transcript")
async def analyze_transcript(analysis: TranscriptAnalysis):
    """Analyze transcript for emergency and meeting detection"""
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    prompt = f"""Analyze this medical conversation transcript for:
1. EMERGENCY: Is there an urgent medical situation?
2. MEETING: Did they schedule an appointment?

Transcript: "{analysis.transcript}"

Respond ONLY with valid JSON (no markdown):
{{
  "emergency": false,
  "urgency_score": 0,
  "emergency_reason": "",
  "meeting_detected": false,
  "meeting_details": {{
    "extracted_phrase": "",
    "date": "",
    "time": ""
  }}
}}"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 500,
                    "messages": [{
                        "role": "user",
                        "content": prompt
                    }]
                },
                timeout=15.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Claude API error")
            
            data = response.json()
            text = data['content'][0]['text'].strip()
            
            # Clean JSON
            if text.startswith('```json'):
                text = text.replace('```json\n', '').replace('\n```', '')
            elif text.startswith('```'):
                text = text.replace('```\n', '').replace('\n```', '')
            
            result = json.loads(text)
            return result
            
    except Exception as e:
        print(f"Error analyzing transcript: {e}")
        return {
            "emergency": False,
            "urgency_score": 0,
            "emergency_reason": "",
            "meeting_detected": False,
            "meeting_details": None
        }

@app.post("/api/meetings/create")
async def create_meeting(meeting: Meeting):
    """Create a new meeting"""
    global next_meeting_id
    
    meeting_data = meeting.dict()
    meeting_data['id'] = next_meeting_id
    meeting_data['created_at'] = datetime.now().isoformat()
    
    meetings_db.append(meeting_data)
    next_meeting_id += 1
    
    return {"message": "Meeting created", "meeting": meeting_data}

@app.get("/api/meetings/upcoming")
async def get_upcoming_meetings():
    """Get all upcoming meetings"""
    return {"meetings": meetings_db}

@app.delete("/api/meetings/{meeting_id}")
async def delete_meeting(meeting_id: int):
    """Delete a meeting"""
    global meetings_db
    meetings_db = [m for m in meetings_db if m['id'] != meeting_id]
    return {"message": "Meeting deleted"}

# Real-time chunk analysis (for emergency/meeting detection)
@app.post("/api/meeting-mode/analyze-chunk")
async def analyze_chunk(chunk: TranscriptChunk):
    """Analyze transcript chunk for instant emergency/meeting detection"""
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    prompt = f"""Analyze this conversation snippet for emergencies and meeting scheduling.

Text: "{chunk.text}"

Respond ONLY with valid JSON (no markdown):
{{
  "emergency": true/false,
  "urgency_score": 0-10,
  "emergency_reason": "brief reason if emergency",
  "meeting_detected": true/false,
  "meeting_details": {{
    "extracted_phrase": "exact phrase from conversation",
    "date": "parsed date if mentioned",
    "time": "parsed time if mentioned"
  }}
}}"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 300,
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Claude API error")
            
            data = response.json()
            text = data['content'][0]['text'].strip()
            
            if text.startswith('```json'):
                text = text.replace('```json\n', '').replace('\n```', '')
            elif text.startswith('```'):
                text = text.replace('```\n', '').replace('\n```', '')
            
            result = json.loads(text)
            return result
            
    except Exception as e:
        print(f"Error analyzing chunk: {e}")
        return {
            "emergency": False,
            "urgency_score": 0,
            "emergency_reason": "",
            "meeting_detected": False,
            "meeting_details": None
        }

# Generate full clinical summary (when session ends)
@app.post("/api/meeting-mode/generate-summary")
async def generate_summary(request: SummaryRequest):
    """Generate comprehensive clinical summary using Claude"""
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    if len(request.transcript) < 50:
        return {"error": "Transcript too short for summary"}
    
    exercise_name = request.sessionContext.get('exercise_name', 'Unknown')
    rep_count = request.sessionContext.get('rep_count', 0)
    target_reps = request.sessionContext.get('target_reps', 0)
    duration = request.duration
    
    prompt = f"""You are a physical therapist analyzing a patient exercise session. Generate a professional clinical summary.

**Session Context:**
- Exercise: {exercise_name}
- Reps Completed: {rep_count}/{target_reps}
- Duration: {duration} seconds
- Emergencies Detected: {len(request.detectedEmergencies)}
- Meetings Scheduled: {len(request.detectedMeetings)}

**Full Conversation Transcript:**
"{request.transcript}"

Generate a clinical summary in JSON format (no markdown):

{{
  "chief_complaint": "Patient's main concern or reason for session",
  "session_notes": "Detailed observations from the conversation and session performance (3-5 sentences)",
  "recommendations": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3"],
  "follow_up_needed": true/false,
  "follow_up_reason": "Why follow-up is needed (if applicable)",
  "patient_mood": "positive/neutral/concerned",
  "compliance_level": "high/medium/low",
  "key_observations": "Any important clinical observations"
}}"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1500,
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Claude API error")
            
            data = response.json()
            text = data['content'][0]['text'].strip()
            
            if text.startswith('```json'):
                text = text.replace('```json\n', '').replace('\n```', '')
            elif text.startswith('```'):
                text = text.replace('```\n', '').replace('\n```', '')
            
            result = json.loads(text)
            return result
            
    except Exception as e:
        print(f"Error generating summary: {e}")
        return {"error": str(e)}