import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Target, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-fitness.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90 z-10" />
        <img 
          src={heroImage} 
          alt="FitLine-Gym Fitness" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <h1 className="font-heading text-6xl md:text-8xl text-white mb-6 leading-tight">
            FitLine-Gym
          </h1>
          <p className="text-2xl md:text-3xl text-white mb-4 font-light">
            No time? No problem.
          </p>
          <p className="text-xl md:text-2xl text-white/90 mb-12 font-medium">
            Daily fitness in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild variant="hero" size="lg" className="text-lg px-8 py-6">
              <Link to="/auth?mode=signup">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 bg-white/10 border-white text-white hover:bg-white hover:text-foreground">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl md:text-6xl text-center mb-16 text-foreground">
            WHY FitLine-Gym?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-gradient-card border-0 shadow-card hover:shadow-hero transition-smooth">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-heading text-2xl mb-4 text-foreground">QUICK WORKOUTS</h3>
                <p className="text-muted-foreground">5-60 minute workouts that fit your schedule</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-card hover:shadow-hero transition-smooth">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-heading text-2xl mb-4 text-foreground">AI COACH</h3>
                <p className="text-muted-foreground">Personal AI guidance and motivation 24/7</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-card hover:shadow-hero transition-smooth">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-heading text-2xl mb-4 text-foreground">DAILY GOALS</h3>
                <p className="text-muted-foreground">Achieve consistent progress with daily challenges</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-card hover:shadow-hero transition-smooth">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-heading text-2xl mb-4 text-foreground">TRACK PROGRESS</h3>
                <p className="text-muted-foreground">Visual insights into your fitness journey</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-16">
            <Button asChild variant="hero" size="lg" className="text-lg px-12 py-6">
              <Link to="/auth?mode=signup">Start Your Journey</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;