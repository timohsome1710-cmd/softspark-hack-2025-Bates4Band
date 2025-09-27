import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BookOpen, Trophy, User, Bell, Plus, MessageSquare, LogOut, Menu } from "lucide-react";
import wsLogo from "@/assets/ws-logo-classic.png";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import QuestionUploadModal from "./QuestionUploadModal";

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Load user profile and stats
    const loadUserData = async () => {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const { data: statsData } = await supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", user.id)
          .single();

        setProfile(profileData);
        setUserStats(statsData);

        // Get unread message count
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .neq("sender_id", user.id)
          .eq("is_read", false);

        setUnreadMessages(count || 0);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (!user || !profile) {
    return null;
  }

  const expPercentage = userStats?.exp_points ? 
    (userStats.exp_points % 1000) / 1000 * 100 : 0;

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={wsLogo} alt="WarungSoal" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-primary">WarungSoal</h1>
              <p className="text-xs text-muted-foreground">USYD Academic Hub</p>
            </div>
          </Link>

          {/* Desktop User Section */}
          <div className="hidden md:flex items-center gap-4">
            <QuestionUploadModal 
              trigger={
                <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:from-primary/90 hover:to-secondary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Ask Question
                </Button>
              }
            />
            
            {/* Messages Button */}
            <Link to="/messages">
              <Button variant="ghost" size="icon" className="relative">
                <MessageSquare className="h-4 w-4" />
                {unreadMessages > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadMessages}
                  </Badge>
                )}
              </Button>
            </Link>
            
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>

            {/* User Profile */}
            <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="hidden lg:block text-right">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{profile.display_name}</span>
                  <Badge variant="secondary" className="bg-gradient-to-r from-level-gold to-level-gold/80 text-primary text-xs">
                    Lv. {userStats?.level || 1}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1 w-16 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-secondary to-accent transition-all duration-300"
                      style={{ width: `${expPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{userStats?.exp_points || 0} EXP</span>
                </div>
              </div>
              <Avatar className="h-8 w-8 border-2 border-secondary">
                <AvatarImage src={profile.avatar_url || ""} alt={profile.display_name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm">
                  {profile.display_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
            
            {/* Sign Out Button */}
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-6 mt-6">
                  {/* User Profile Mobile */}
                  <Link to="/profile" className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
                    <Avatar className="h-10 w-10 border-2 border-secondary">
                      <AvatarImage src={profile.avatar_url || ""} alt={profile.display_name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                        {profile.display_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{profile.display_name}</span>
                        <Badge variant="secondary" className="bg-gradient-to-r from-level-gold to-level-gold/80 text-primary text-xs">
                          Lv. {userStats?.level || 1}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 w-16 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-secondary to-accent transition-all duration-300"
                            style={{ width: `${expPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{userStats?.exp_points || 0} EXP</span>
                      </div>
                    </div>
                  </Link>

                  {/* Ask Question Mobile */}
                  <QuestionUploadModal 
                    trigger={
                      <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:from-primary/90 hover:to-secondary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        Ask Question
                      </Button>
                    }
                  />

                  {/* Messages Mobile */}
                  <Link to="/messages">
                    <Button variant="outline" className="w-full justify-start relative">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Messages
                      {unreadMessages > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                          {unreadMessages}
                        </Badge>
                      )}
                    </Button>
                  </Link>

                  {/* Notifications Mobile */}
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Button>

                  {/* Sign Out Mobile */}
                  <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;