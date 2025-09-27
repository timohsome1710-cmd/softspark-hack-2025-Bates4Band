import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import FriendsSearch from "@/components/FriendsSearch";
import { Navigate } from "react-router-dom";

const Friends = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Friends</h1>
            <p className="text-muted-foreground mt-2">
              Connect with your classmates and start conversations
            </p>
          </div>
          <FriendsSearch />
        </div>
      </main>
    </div>
  );
};

export default Friends;