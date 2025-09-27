import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Trophy, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-illustration.jpg";
import usydLogo from "@/assets/usyd-logo.png";
import QuestionUploadModal from "./QuestionUploadModal";

const HeroSection = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    active_students: 0,
    questions_solved: 0,
    this_week_questions: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_homepage_stats');
        if (error) throw error;
        if (data && data.length > 0) {
          setStats(data[0]);
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    loadStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const scrollToQuestions = () => {
    const questionsSection = document.querySelector('[data-questions]');
    if (questionsSection) {
      questionsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToLeaderboard = () => {
    const leaderboard = document.querySelector('[data-leaderboard]');
    if (leaderboard) {
      leaderboard.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-primary via-primary to-secondary overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_50%,transparent_75%)] bg-[length:20px_20px]" />
      
      <div className="relative container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <Badge className="mb-4 bg-secondary/20 text-secondary border-secondary/30 hover:bg-secondary/30">
              <Sparkles className="mr-2 h-3 w-3" />
              USYD Academic Community
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
              Learn Together,
              <br />
              <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                Achieve More
              </span>
            </h1>
            
            <p className="text-lg lg:text-xl text-primary-foreground/80 mb-8 max-w-2xl">
              Join USYD's most active Q&A platform. Ask questions, share knowledge, 
              and climb the leaderboard while helping your fellow students succeed.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-secondary hover:bg-secondary/90 text-primary font-semibold px-8 py-3 text-lg"
                onClick={scrollToQuestions}
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Browse Questions
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-white bg-white text-primary hover:bg-white/90 hover:text-primary/90 px-8 py-3 text-lg font-semibold"
                onClick={scrollToLeaderboard}
              >
                <Trophy className="mr-2 h-5 w-5" />
                View Leaderboard
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-12 justify-center lg:justify-start">
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-primary-foreground">{stats.active_students}</div>
                <div className="text-sm text-primary-foreground/70">Active Students</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-primary-foreground">{stats.questions_solved}</div>
                <div className="text-sm text-primary-foreground/70">Questions Solved</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-primary-foreground">0</div>
                <div className="text-sm text-primary-foreground/70">Seasons Passed</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative">
              <img 
                src={usydLogo}
                alt="University of Sydney"
                className="w-full max-w-md mx-auto p-8 transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;