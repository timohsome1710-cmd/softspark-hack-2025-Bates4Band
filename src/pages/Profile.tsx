import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Star, MessageCircle, BookOpen, Award, TrendingUp, Calendar, Target, Home, Edit2, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  major?: string;
  year?: number;
  semester?: number;
  created_at: string;
}

interface UserStats {
  level: number;
  total_exp: number;
  seasonal_exp: number;
  exp_points: number;
  questions_asked: number;
  questions_answered: number;
  trophy_rank: string;
}

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    major: '',
    year: '',
    semester: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      loadUserData();
    }
  }, [user, loading, navigate]);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoadingData(true);
    try {
      // Load profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // Load user stats
      const { data: statsData, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (statsError) throw statsError;

      setProfile(profileData);
      setUserStats(statsData);
      
      // Set edit form data
      setEditForm({
        display_name: profileData.display_name || '',
        major: profileData.major || '',
        year: profileData.year?.toString() || '',
        semester: profileData.semester?.toString() || ''
      });

    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: editForm.display_name,
          major: editForm.major,
          year: editForm.year ? parseInt(editForm.year) : null,
          semester: editForm.semester ? parseInt(editForm.semester) : null
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      setIsEditing(false);
      loadUserData();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(word => word[0]?.toUpperCase()).join('').slice(0, 2) || 'U';
  };

  const getExpToNext = (level: number) => level * 1000;
  const getExpPercentage = (currentExp: number, level: number) => {
    const expForThisLevel = (level - 1) * 1000;
    const expForNextLevel = level * 1000;
    const progressInLevel = currentExp - expForThisLevel;
    const expNeededForLevel = expForNextLevel - expForThisLevel;
    return Math.min((progressInLevel / expNeededForLevel) * 100, 100);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading profile...</div>
      </div>
    );
  }

  if (!user || !profile || !userStats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Profile not found</div>
      </div>
    );
  }

  const expPercentage = getExpPercentage(userStats.total_exp, userStats.level);
  const expToNext = getExpToNext(userStats.level);
  const expNeeded = expToNext - userStats.total_exp;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")} 
          className="mb-6 gap-2"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="relative mx-auto mb-4">
                    <Avatar className="h-24 w-24 mx-auto border-4 border-secondary">
                      <AvatarImage src={profile.avatar_url || ""} alt={profile.display_name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-2xl font-bold">
                        {getInitials(profile.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                      onClick={() => {
                        toast({
                          title: "Coming Soon",
                          description: "Avatar upload feature will be available soon!",
                        });
                      }}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editForm.display_name}
                        onChange={(e) => setEditForm({...editForm, display_name: e.target.value})}
                        placeholder="Display Name"
                      />
                      <Input
                        value={editForm.major}
                        onChange={(e) => setEditForm({...editForm, major: e.target.value})}
                        placeholder="Major (e.g., Computer Science)"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={editForm.year}
                          onChange={(e) => setEditForm({...editForm, year: e.target.value})}
                          placeholder="Year"
                          type="number"
                        />
                        <Input
                          value={editForm.semester}
                          onChange={(e) => setEditForm({...editForm, semester: e.target.value})}
                          placeholder="Semester"
                          type="number"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleUpdateProfile} size="sm">Save</Button>
                        <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setIsEditing(true)}
                          className="h-6 w-6"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground text-sm mb-1">{user.email}</p>
                      {profile.major && (
                        <p className="text-muted-foreground text-sm mb-1">{profile.major}</p>
                      )}
                      {profile.year && (
                        <p className="text-muted-foreground text-sm mb-4">
                          Year {profile.year} {profile.semester ? `, Semester ${profile.semester}` : ''}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <Badge className="bg-gradient-to-r from-level-gold to-level-gold/80 text-primary text-lg px-3 py-1 mb-6">
                    Level {userStats.level}
                  </Badge>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress to Level {userStats.level + 1}</span>
                      <span className="font-medium">{userStats.total_exp} / {expToNext} EXP</span>
                    </div>
                    <Progress value={expPercentage} className="h-3" />
                    <p className="text-xs text-muted-foreground">
                      {expNeeded} EXP needed for next level
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Questions Asked</span>
                  </div>
                  <span className="font-bold">{userStats.questions_asked}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Answers Given</span>
                  </div>
                  <span className="font-bold">{userStats.questions_answered}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-secondary" />
                    <span className="text-sm">Trophy Rank</span>
                  </div>
                  <Badge variant="secondary" className="capitalize">{userStats.trophy_rank}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Seasonal EXP</span>
                  </div>
                  <span className="font-bold">{userStats.seasonal_exp}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Member Since</span>
                  </div>
                  <span className="text-sm font-medium">
                    {new Date(profile.created_at).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="stats" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
              </TabsList>

              {/* Statistics Tab */}
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Current Season</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Seasonal EXP</span>
                        <span className="font-bold text-level-gold">{userStats.seasonal_exp}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Questions Asked</span>
                        <span className="font-bold">{userStats.questions_asked}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Answers Given</span>
                        <span className="font-bold">{userStats.questions_answered}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Trophy Rank</span>
                        <Badge className="capitalize">{userStats.trophy_rank}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">All Time</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total EXP</span>
                        <span className="font-bold text-primary">{userStats.total_exp.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Current Level</span>
                        <span className="font-bold">{userStats.level}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">EXP Points</span>
                        <span className="font-bold">{userStats.exp_points}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Member Since</span>
                        <span className="font-bold">
                          {new Date(profile.created_at).getFullYear()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Goals Tab */}
              <TabsContent value="goals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-secondary" />
                      Weekly Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Answer 5 questions</span>
                        <span className="text-sm text-muted-foreground">
                          {Math.min(userStats.questions_answered, 5)}/5
                        </span>
                      </div>
                      <Progress value={(Math.min(userStats.questions_answered, 5) / 5) * 100} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Earn 500 EXP</span>
                        <span className="text-sm text-muted-foreground">
                          {Math.min(userStats.seasonal_exp, 500)}/500
                        </span>
                      </div>
                      <Progress value={(Math.min(userStats.seasonal_exp, 500) / 500) * 100} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Ask 2 questions</span>
                        <span className="text-sm text-muted-foreground">
                          {Math.min(userStats.questions_asked, 2)}/2 {userStats.questions_asked >= 2 ? '✓' : ''}
                        </span>
                      </div>
                      <Progress value={(Math.min(userStats.questions_asked, 2) / 2) * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Season Goals</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Reach Silver Rank</span>
                        <span className="text-sm text-muted-foreground">
                          {userStats.trophy_rank === 'silver' || userStats.trophy_rank === 'gold' || userStats.trophy_rank === 'platinum' || userStats.trophy_rank === 'diamond' || userStats.trophy_rank === 'radiant' ? 'Complete ✓' : 'In Progress'}
                        </span>
                      </div>
                      <Progress 
                        value={userStats.trophy_rank !== 'bronze' ? 100 : (userStats.seasonal_exp / 500) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;