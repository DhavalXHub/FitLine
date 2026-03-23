import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Pause, Play, RotateCcw, SkipForward, ArrowLeft, Clock, Target, Zap, CheckCircle, Timer, AlertCircle, Video } from "lucide-react";
import { getPersonalizedWorkout, workoutTypes, type Workout } from "@/lib/workouts";
import { useAuth } from "@/contexts/AuthContext";
import ExerciseVideoModal from "@/components/ExerciseVideoModal";
import AnimatedExercise from "@/components/AnimatedExercise";

const parseSeconds = (text: string | undefined): number | null => {
  if (!text) return null;
  const m = text.match(/(\d+)\s*(seconds|second|sec|s)/i);
  if (m) return parseInt(m[1], 10);
  const mMin = text.match(/(\d+)\s*(minutes|minute|min|m)/i);
  if (mMin) return parseInt(mMin[1], 10) * 60;
  const repsRange = text.match(/(\d+)(?:\s*-\s*(\d+))?\s*(reps|rep|times)/i);
  if (repsRange) {
    const base = parseInt(repsRange[1], 10);
    return Math.max(10, Math.min(180, base * 3));
  }
  return null;
};

const WorkoutSession = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const workoutId = searchParams.get("workout");
  const typeParam = searchParams.get("type");
  const workoutTypeKey = typeParam && workoutTypes[typeParam] ? typeParam : undefined;

  // Derive workout either by id scan or by type/day fallback
  const workout: Workout | null = useMemo(() => {
    if (workoutId) {
      for (const key of Object.keys(workoutTypes)) {
        const found = workoutTypes[key].workouts.find((w) => w.id === workoutId);
        if (found) return found;
      }
    }
    const today = new Date().getDay();
    const typeKey = workoutTypeKey || "classic";
    return getPersonalizedWorkout(userProfile || null, typeKey, today);
  }, [workoutId, workoutTypeKey, userProfile]);

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [isRestPhase, setIsRestPhase] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<{name: string, videoUrl?: string, videoThumbnail?: string} | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isAdvancingRef = useRef(false);
  const lastAdvanceTsRef = useRef<number>(0);
  const [manualMode, setManualMode] = useState(false);

  const currentExercise = workout ? workout.exercises[exerciseIndex] : null;

  // Calculate workout progress (dedupe + clamp)
  const totalExercises = workout ? workout.exercises.length : 0;
  const uniqueCompletedCount = Math.min(new Set(completedExercises).size, totalExercises);
  const workoutProgress = totalExercises > 0 ? Math.min((uniqueCompletedCount / totalExercises) * 100, 100) : 0;
  
  // Debug logging
  if (completedExercises.length > 0) {
    console.log('Debug - completedExercises:', completedExercises);
    console.log('Debug - totalExercises:', totalExercises);
    console.log('Debug - workoutProgress:', workoutProgress);
  }
  
  // Calculate exercise progress within current exercise
  const currentExerciseProgress = currentExercise ? ((setIndex + 1) / currentExercise.sets) * 100 : 0;
  
  // Get timer color based on time remaining
  const getTimerColor = () => {
    if (secondsLeft === null) return "text-gray-500";
    if (isRestPhase) return "text-blue-500";
    if (secondsLeft <= 10) return "text-red-500 animate-pulse";
    if (secondsLeft <= 30) return "text-orange-500";
    return "text-green-500";
  };

  // Get timer background color
  const getTimerBgColor = () => {
    if (secondsLeft === null) return "bg-gray-100";
    if (isRestPhase) return "bg-blue-50";
    if (secondsLeft <= 10) return "bg-red-50 animate-pulse";
    if (secondsLeft <= 30) return "bg-orange-50";
    return "bg-green-50";
  };

  const cancelSpeech = () => {
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    } catch {}
  };

  const speak = (text: string) => {
    if (!voiceEnabled || !text) return;
    try {
      cancelSpeech();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 1;
      u.pitch = 1;
      u.volume = 1;
      
      u.onstart = () => {
        setIsSpeaking(true);
      };
      
      u.onend = () => {
        setIsSpeaking(false);
      };
      
      u.onerror = () => {
        setIsSpeaking(false);
      };
      
      utterRef.current = u;
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const tipsForExercise = (name?: string | null) => {
    const n = (name || "").toLowerCase();
    if (n.includes("jumping jacks")) return "Land softly, keep core engaged, and breathe steadily.";
    if (n.includes("push-up")) return "Keep a straight line from head to heels, elbows at 45 degrees.";
    if (n.includes("mountain climbers")) return "Drive knees towards chest, keep hips low and core tight.";
    if (n.includes("squat")) return "Chest up, sit back into heels, knees track over toes.";
    if (n.includes("plank")) return "Squeeze glutes, keep spine neutral, don’t let hips sag.";
    if (n.includes("burpee")) return "Move smoothly, protect lower back, and land softly.";
    if (n.includes("high knees")) return "Pump arms, lift knees to hip height, stay tall.";
    if (n.includes("row")) return "Pull with back, keep shoulders down and core braced.";
    if (n.includes("lunge")) return "Step long, front knee over ankle, torso upright.";
    if (n.includes("deadlift")) return "Hinge at hips, flat back, keep the bar close to body.";
    if (n.includes("bench press")) return "Shoulder blades retracted, feet planted, control the descent.";
    if (n.includes("goblet squat")) return "Elbows down, keep kettlebell close, sit deep with neutral spine.";
    return "Maintain good form and steady breathing.";
  };

  const secondsToSpeech = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const parts: string[] = [];
    if (m > 0) parts.push(`${m} ${m === 1 ? "minute" : "minutes"}`);
    if (s > 0) parts.push(`${s} ${s === 1 ? "second" : "seconds"}`);
    return parts.join(" ");
  };

  // Initialize timer for the exercise or its rest when starting a set
  const startTimerForCurrent = () => {
    if (!currentExercise) return;
    
    // Set workout start time if not already set
    if (!workoutStartTime) {
      setWorkoutStartTime(new Date());
    }
    
    // Prefer duration if present, else parse from reps; default to 45s
    const parsed = parseSeconds(currentExercise.duration || currentExercise.reps);
    const duration = parsed ?? 45;
    setSecondsLeft(duration);
    setIsRunning(true);
    setIsRestPhase(false);
    setManualMode(false);
    speak(`Start ${currentExercise.name} for the next ${secondsToSpeech(duration)}. ${tipsForExercise(currentExercise.name)}`);
  };

  const clearTimer = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Tick
  useEffect(() => {
    clearTimer();
    if (isRunning && secondsLeft !== null) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => (s !== null ? Math.max(0, s - 1) : s));
      }, 1000) as unknown as number;
    }
    return clearTimer;
  }, [isRunning]);

  // Auto-advance when timer hits zero: rest -> next set/exercise
  useEffect(() => {
    if (secondsLeft === 0) {
      setIsRunning(false);
      // If exercise has rest, schedule rest timer, then advance
      const restSec = parseSeconds(currentExercise?.rest);
      if (restSec && restSec > 0) {
        setSecondsLeft(restSec);
        setIsRunning(true);
        setIsRestPhase(true);
        speak(`Rest for ${secondsToSpeech(restSec)}.`);
        // After rest completes, move on
        const t = window.setTimeout(() => {
          setIsRunning(false);
          // keep timer visible and immediately start next timer in advance()
          advance();
        }, restSec * 1000);
        return () => window.clearTimeout(t);
      } else {
        advance();
      }
    }
  }, [secondsLeft]);

  const advance = () => {
    if (!currentExercise || isAdvancingRef.current) return;
    const now = Date.now();
    if (now - lastAdvanceTsRef.current < 700) return;
    isAdvancingRef.current = true;
    lastAdvanceTsRef.current = now;
    const totalSets = currentExercise.sets || 1;
    
    // If we have more sets to do, just move to next set
    if (setIndex + 1 < totalSets) {
      setSetIndex(setIndex + 1);
      isAdvancingRef.current = false;
      // start next set timer
      setTimeout(() => startTimerForCurrent(), 0);
      return;
    }
    
    // All sets completed for current exercise - mark as completed
    if (!completedExercises.includes(exerciseIndex)) {
      setCompletedExercises(prev => [...prev, exerciseIndex]);
    }
    
    // Move to next exercise
    if (workout && exerciseIndex + 1 < workout.exercises.length) {
      setExerciseIndex(exerciseIndex + 1);
      setSetIndex(0);
      isAdvancingRef.current = false;
      // next exercise timer
      setTimeout(() => startTimerForCurrent(), 0);
      return;
    }
    
    // Completed workout
    setIsRunning(false);
    setSecondsLeft(0);
    setIsRestPhase(false);
    isAdvancingRef.current = false;
    speak("Workout complete. Great job! Remember to cool down and hydrate.");
  };

  const handleCompleteSet = () => {
    if (!manualMode) return;
    advance();
  };

  const handleStart = () => {
    if (!currentExercise) return;
    // Start from current state
    startTimerForCurrent();
  };

  const handlePause = () => {
    setIsRunning(false);
    speak("Paused. Tap resume to continue.");
  };

  const handleResume = () => {
    if (secondsLeft !== null && secondsLeft > 0) {
      setIsRunning(true);
      speak(`Resuming ${isRestPhase ? 'rest' : currentExercise?.name || 'exercise'} with ${secondsToSpeech(secondsLeft)} remaining.`);
    }
  };

  const handleRestart = () => {
    setIsRunning(false);
    setSecondsLeft(null);
    setSetIndex(0);
    setExerciseIndex(0);
    setIsRestPhase(false);
    setWorkoutStartTime(null);
    setCompletedExercises([]);
    isAdvancingRef.current = false;
    speak("Restarting workout. Begin with a light warm up for five minutes.");
  };

  const handleSkip = () => {
    // Keep the current time visible to avoid flicker while advancing
    setIsRunning(false);
    setIsRestPhase(false);
    setManualMode(false);
    cancelSpeech();
    advance();
    speak("Skipping to the next exercise.");
  };

  const handleVideoClick = (exercise: {name: string, videoUrl?: string, videoThumbnail?: string}) => {
    setSelectedExercise(exercise);
    setIsVideoModalOpen(true);
  };

  const formatTime = (s: number | null) => {
    if (s === null) return "--:--";
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  if (!workout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p>Workout not found.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button onClick={() => navigate(-1)} variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">{workout.name}</span>
            </div>
            <Button 
              variant={voiceEnabled ? "secondary" : "outline"} 
              size="sm"
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                if (!next) cancelSpeech();
              }}
              className={`bg-white/10 border-white text-white hover:bg-white hover:text-foreground transition-all duration-300 ${
                isSpeaking ? 'animate-pulse bg-primary/20' : ''
              }`}
            >
              {isSpeaking ? '🎤' : voiceEnabled ? '🔊' : '🔇'} Voice
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Workout Progress */}
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Workout Progress
              </h3>
              <span className="text-muted-foreground text-sm">
                {uniqueCompletedCount} of {totalExercises} exercises
              </span>
            </div>
            <Progress value={workoutProgress} className="h-3" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>0%</span>
              <span className="font-semibold">{Math.round(workoutProgress)}%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        {/* Main Timer Card */}
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardContent className="p-6">
            {/* Exercise Info */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <h2 className="text-lg font-semibold text-primary">
                  {isRestPhase ? "REST TIME" : "CURRENT EXERCISE"}
                </h2>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              
              <h1 className="text-2xl font-bold mb-3">
                {currentExercise?.name}
              </h1>
              
              <div className="flex items-center justify-center gap-4 text-muted-foreground text-sm">
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  <span>Set {setIndex + 1} of {currentExercise?.sets || 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Timer className="w-4 h-4" />
                  <span>{currentExercise?.reps}</span>
                </div>
              </div>
            </div>

            {/* Timer Display */}
            <div className={`text-center mb-6 p-6 rounded-2xl ${getTimerBgColor()} transition-all duration-500 relative`}>
              {/* Voice Speaking Effect */}
              {isSpeaking && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 border-4 border-primary/30 rounded-full animate-ping"></div>
                  <div className="absolute w-40 h-40 border-2 border-primary/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute w-48 h-48 border border-primary/10 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                </div>
              )}
              
              <div className={`text-5xl font-bold ${getTimerColor()} mb-4 transition-all duration-300 relative z-10 min-h-[3rem] flex items-center justify-center`}>
                {formatTime(secondsLeft)}
              </div>
              
              {isRestPhase && (
                <div className="text-lg text-blue-600 font-semibold animate-pulse">
                  Take a breather! 💙
                </div>
              )}
              
              {!isRestPhase && secondsLeft && secondsLeft <= 10 && (
                <div className="text-lg text-red-600 font-bold animate-bounce">
                  Almost there! 🔥
                </div>
              )}
            </div>

            {/* Exercise Tips */}
            {currentExercise && !isRestPhase && (
              <div className="bg-primary/10 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-2">Form Tip:</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {tipsForExercise(currentExercise.name)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              {!isRunning && (secondsLeft === null || secondsLeft > 0) && (
                <Button 
                  onClick={handleStart} 
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {workoutStartTime ? 'Continue' : 'Start Workout'}
                </Button>
              )}
              
              {isRunning && (
                <Button 
                  onClick={handlePause} 
                  variant="outline" 
                  size="lg"
                  className="border-primary text-primary hover:bg-primary hover:text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
              )}
              
              {!isRunning && secondsLeft !== null && secondsLeft > 0 && (
                <Button 
                  onClick={handleResume} 
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
              )}

              {manualMode && (
                <Button 
                  onClick={handleCompleteSet}
                  variant="secondary"
                  size="lg"
                  className="px-6 py-3 rounded-xl shadow-lg"
                >
                  Complete Set
                </Button>
              )}
              
              <Button 
                onClick={handleSkip} 
                variant="outline" 
                size="lg"
                className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-bold px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip
              </Button>
              
              <Button 
                onClick={handleRestart} 
                variant="outline" 
                size="lg"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Exercise List - match Home page styling */}
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              EXERCISE BREAKDOWN
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workout.exercises.map((exercise, index) => (
                <div key={index} className={`p-6 border-2 rounded-2xl transition-all duration-300 ${
                  index === exerciseIndex
                    ? 'border-green-400 bg-green-400/20 shadow-lg shadow-green-400/20'
                    : completedExercises.includes(index)
                    ? 'border-green-600 bg-green-600/20'
                    : 'border-primary/20 hover:shadow-card hover:border-primary/40 bg-gradient-to-r from-background to-primary/5'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <AnimatedExercise exerciseName={exercise.name} className="w-12 h-12" />
                        <h4 className="font-semibold text-lg">{exercise.name}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {index === exerciseIndex && (
                        <Badge className="bg-green-400 text-green-900 font-bold">Current</Badge>
                      )}
                      <Badge variant="secondary" className="bg-primary/20 text-primary font-semibold px-3 py-1">
                        {exercise.sets} sets
                      </Badge>
                      <Button
                        onClick={() => handleVideoClick(exercise)}
                        variant="outline"
                        size="sm"
                        className="border-primary/30 text-primary hover:bg-primary hover:text-white transition-all duration-300"
                      >
                        <Video className="w-4 h-4 mr-1" />
                        Watch
                      </Button>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6 text-sm">
                    <div className="bg-white/50 rounded-lg p-3">
                      <span className="text-muted-foreground font-medium">Reps/Duration:</span>
                      <p className="font-semibold text-lg text-primary">{exercise.reps}</p>
                    </div>
                    {exercise.rest && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <span className="text-muted-foreground font-medium">Rest:</span>
                        <p className="font-semibold text-lg text-blue-600">{exercise.rest}</p>
                      </div>
                    )}
                    {exercise.notes && (
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <span className="text-muted-foreground font-medium">Notes:</span>
                        <p className="font-semibold text-lg text-yellow-700">{exercise.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercise Video Modal */}
      <ExerciseVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => {
          setIsVideoModalOpen(false);
          setSelectedExercise(null);
        }}
        exerciseName={selectedExercise?.name || ""}
        videoUrl={selectedExercise?.videoUrl}
        videoThumbnail={selectedExercise?.videoThumbnail}
      />
    </div>
  );
};

export default WorkoutSession;


