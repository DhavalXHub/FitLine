import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Download, Quote, Target, TrendingUp, User, LogOut } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { getPersonalizedWorkout, getRecommendedWorkoutType, getDifficultyColor, getDifficultyLabel } from "@/lib/workouts";
import { collection, getDocs, query, where } from "firebase/firestore";

const Dashboard = () => {
  const { userProfile, logout, refreshProfile, user } = useAuth();
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [goal, setGoal] = useState<string>("");
  const [experience, setExperience] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const weeklyGoal = 7;

  useEffect(() => {
    // If key profile fields are missing, prompt user to complete profile
    if (userProfile) {
      const missingBasics = !userProfile.fitnessGoal || !userProfile.experienceLevel;
      setShowCompleteProfile(missingBasics);
      setGoal((userProfile.fitnessGoal as any) || "");
      setExperience((userProfile.experienceLevel as any) || "");
    }
  }, [userProfile]);

  const saveBasics = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        fitnessGoal: goal || null,
        experienceLevel: experience || null,
        updatedAt: new Date(),
      });
      await refreshProfile();
      setShowCompleteProfile(false);
    } catch (e) {
      console.error("Failed to save basics", e);
    } finally {
      setSaving(false);
    }
  };
  const todaysQuote = "The only bad workout is the one that didn't happen.";
  // Compute current week range (Mon-Sun in local time)
  useEffect(() => {
    const loadWeekly = async () => {
      if (!user) return;
      const now = new Date();
      const day = (now.getDay() + 6) % 7; // convert Sun=0 to Sun=6 (Mon=0)
      const monday = new Date(now);
      monday.setDate(now.getDate() - day);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const toDateKey = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const startKey = toDateKey(monday);
      const endKey = toDateKey(sunday);

      // Fetch all docs in users/{uid}/completions and count those in range
      const ref = collection(db, "users", user.uid, "completions");
      const snapshot = await getDocs(ref);
      let count = 0;
      snapshot.forEach((docSnap) => {
        const data: any = docSnap.data();
        const key = data.dateKey || docSnap.id;
        if (key >= startKey && key <= endKey) count += 1;
      });
      setWeeklyProgress(count);
    };
    loadWeekly();
  }, [user]);

  // Get personalized workout recommendation
  const recommendedType = getRecommendedWorkoutType(userProfile);
  const today = new Date().getDay();
  const todaysWorkout = getPersonalizedWorkout(userProfile, recommendedType, today);

  return (
    <div className="min-h-screen bg-background">
      <Dialog open={showCompleteProfile} onOpenChange={setShowCompleteProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Let’s personalize your plan</DialogTitle>
            <DialogDescription>
              Choose your goal and experience level. You can refine more details anytime in Setup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Primary Goal</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose-weight">Lose Weight</SelectItem>
                  <SelectItem value="build-muscle">Build Muscle</SelectItem>
                  <SelectItem value="stay-fit">Stay Fit</SelectItem>
                  <SelectItem value="improve-endurance">Improve Endurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Experience Level</Label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <div className="w-full grid grid-cols-2 gap-2">
              <Button asChild variant="outline">
                <Link to="/setup">More Options</Link>
              </Button>
              <Button onClick={saveBasics} disabled={saving || !goal || !experience}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Header */}
      <header className="bg-gradient-primary text-white p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-heading text-3xl">
              WELCOME BACK, {userProfile?.displayName?.toUpperCase() || "FITNESS WARRIOR"}!
            </h1>
            <p className="text-white/90">Ready for today's challenge?</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-foreground">
              <Link to="/profile">
                <User className="w-4 h-4" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="bg-white/10 border-white text-white hover:bg-white hover:text-foreground"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">Today's Workout</TabsTrigger>
            <TabsTrigger value="progress">Weekly Progress</TabsTrigger>
            <TabsTrigger value="motivation">Daily Quote</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Today's Workout Tab */}
          <TabsContent value="today" className="space-y-6">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-2xl flex items-center gap-2">
                  <Clock className="w-6 h-6 text-primary" />
                  TODAY'S WORKOUT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-heading text-xl mb-4">RECOMMENDED FOR YOU</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{todaysWorkout.name}</h4>
                            <Badge 
                              variant="outline" 
                              className={`${getDifficultyColor(todaysWorkout.difficulty)} border-current`}
                            >
                              {getDifficultyLabel(todaysWorkout.difficulty)}
                            </Badge>
                          </div>
                          <Badge variant="secondary">{todaysWorkout.duration}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {todaysWorkout.description}
                        </p>
                        <div className="flex gap-2">
                          <Button asChild variant="default" className="flex-1">
                            <Link to={`/daily-workout?type=${recommendedType}`}>Start Workout</Link>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <a href={todaysWorkout.guideLink} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-heading text-xl mb-4">QUICK OPTIONS</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button asChild variant="outline" className="h-16 flex-col">
                        <Link to="/daily-workout?type=quickie">
                          <span className="font-semibold">Quickie</span>
                          <span className="text-xs">5-10 min</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-16 flex-col">
                        <Link to="/daily-workout?type=classic">
                          <span className="font-semibold">Classic</span>
                          <span className="text-xs">20-30 min</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-16 flex-col">
                        <Link to="/daily-workout?type=power">
                          <span className="font-semibold">Power</span>
                          <span className="text-xs">45-60 min</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-16 flex-col">
                        <Link to="/daily-workout?type=beast">
                          <span className="font-semibold">Beast</span>
                          <span className="text-xs">1.5+ hrs</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weekly Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-2xl flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" />
                  WEEKLY CHALLENGE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Week Progress</span>
                      <span className="text-sm text-muted-foreground">{weeklyProgress}/{weeklyGoal} days completed</span>
                    </div>
                    <Progress value={(weeklyProgress / weeklyGoal) * 100} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                      <div 
                        key={day} 
                        className={`p-3 text-center rounded-lg ${
                          index < weeklyProgress 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <div className="text-xs font-medium">{day}</div>
                        <div className="text-xl">
                          {index < weeklyProgress ? '✓' : '○'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">127</div>
                      <div className="text-sm text-muted-foreground">Total Workouts</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">45hrs</div>
                      <div className="text-sm text-muted-foreground">Time Trained</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">18</div>
                      <div className="text-sm text-muted-foreground">Week Streak</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Quote Tab */}
          <TabsContent value="motivation" className="space-y-6">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-2xl flex items-center gap-2">
                  <Quote className="w-6 h-6 text-primary" />
                  DAILY MOTIVATION
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-6">
                  <blockquote className="text-2xl font-medium text-foreground italic">
                    "{todaysQuote}"
                  </blockquote>
                  <div className="flex justify-center">
                    <Button variant="hero">Share Quote</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-2xl flex items-center gap-2">
                  <Download className="w-6 h-6 text-primary" />
                  DOWNLOADABLE RESOURCES
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg hover:shadow-card transition-smooth">
                    <h4 className="font-semibold mb-2">Workout Tracker PDF</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Print-friendly workout log to track your progress offline
                    </p>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg hover:shadow-card transition-smooth">
                    <h4 className="font-semibold mb-2">Nutrition Guide</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Simple meal planning and macro tracking guide
                    </p>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg hover:shadow-card transition-smooth">
                    <h4 className="font-semibold mb-2">Exercise Form Guide</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Visual guide for proper exercise technique and safety
                    </p>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg hover:shadow-card transition-smooth">
                    <h4 className="font-semibold mb-2">Goal Setting Worksheet</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      SMART goals template for fitness and health objectives
                    </p>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;