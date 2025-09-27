import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryFilter from "@/components/CategoryFilter";
import DifficultyFilter from "@/components/DifficultyFilter";
import QuestionCard from "@/components/QuestionCard";
import SimplifiedLeaderboard from "@/components/SimplifiedLeaderboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  title: string;
  content: string;
  category: string;
  difficulty: string;
  author_id: string;
  created_at: string;
  media_urls?: string[];
  media_types?: string[];
  latex_content?: string;
  author?: {
    display_name: string;
    avatar_url?: string;
  };
  answer_count?: number;
  has_approved_answer?: boolean;
  has_teacher_approved_answer?: boolean;
}

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [teacherApprovedFilter, setTeacherApprovedFilter] = useState("all");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 4;

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Load questions from database
  useEffect(() => {
    if (!user) return;

    const loadQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select(`
            *,
            profiles:author_id(display_name, avatar_url)
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Get answer counts for each question
        const questionsWithCounts = await Promise.all((data || []).map(async (question) => {
          const { count } = await supabase
            .from("answers")
            .select("*", { count: "exact", head: true })
            .eq("question_id", question.id);

          return {
            ...question,
            answer_count: count || 0,
            has_approved_answer: question.has_approved_answer || false,
            has_teacher_approved_answer: question.has_teacher_approved_answer || false,
            author: question.profiles
          };
        }));

        setQuestions(questionsWithCounts);
      } catch (error) {
        console.error("Error loading questions:", error);
        toast({
          title: "Error",
          description: "Failed to load questions",
          variant: "destructive",
        });
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();

    // Set up real-time subscription for new questions and answer updates
    const channel = supabase
      .channel('questions-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'questions' },
        () => loadQuestions()
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'answers' },
        () => loadQuestions()
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'answers' },
        () => loadQuestions()
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'questions' },
        () => loadQuestions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Filter questions based on selected criteria
  const filteredQuestions = questions.filter(question => {
    let matchesCategory = selectedCategory === "all";
    
    if (!matchesCategory) {
      const questionCategory = question.category.toLowerCase();
      const selectedCat = selectedCategory.toLowerCase();
      
      // Handle category variations and partial matches
      if (selectedCat === "mathematics") {
        matchesCategory = questionCategory.includes("math");
      } else if (selectedCat === "science") {
        matchesCategory = questionCategory.includes("science");
      } else if (selectedCat === "social studies") {
        matchesCategory = questionCategory.includes("social") || questionCategory.includes("studies");
      } else {
        matchesCategory = questionCategory === selectedCat;
      }
    }
    
    const matchesDifficulty = selectedDifficulty === "all" || 
      question.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeacherFilter = teacherApprovedFilter === "all" || 
      (teacherApprovedFilter === "teacher-approved" && question.has_teacher_approved_answer);
    
    return matchesCategory && matchesDifficulty && matchesSearch && matchesTeacherFilter;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = filteredQuestions.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedDifficulty, searchTerm, teacherApprovedFilter]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to questions section
    const questionsSection = document.querySelector('[data-questions]');
    if (questionsSection) {
      questionsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories and Difficulty */}
          <div className="lg:col-span-1 space-y-6">
            <CategoryFilter 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            <DifficultyFilter 
              selectedDifficulty={selectedDifficulty}
              onDifficultyChange={setSelectedDifficulty}
            />
          </div>

          {/* Questions Feed */}
          <div className="lg:col-span-2 space-y-6" data-questions>
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant={teacherApprovedFilter === "teacher-approved" ? "default" : "outline"}
                onClick={() => setTeacherApprovedFilter(teacherApprovedFilter === "all" ? "teacher-approved" : "all")}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {teacherApprovedFilter === "teacher-approved" ? "Teacher Approved" : "All Questions"}
              </Button>
            </div>

            {/* Questions Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                Recent Questions
                <span className="ml-2 text-lg text-muted-foreground">
                  ({filteredQuestions.length})
                </span>
              </h2>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {loadingQuestions ? (
                <div className="text-center py-12">
                  <div className="text-xl text-muted-foreground">Loading questions...</div>
                </div>
              ) : currentQuestions.length > 0 ? (
                <>
                  {currentQuestions.map(question => (
                    <QuestionCard key={question.id} question={question} />
                  ))}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex gap-1">
                        {[...Array(totalPages)].map((_, index) => {
                          const page = index + 1;
                          const isCurrentPage = page === currentPage;
                          
                          // Show first page, last page, current page, and pages around current
                          const showPage = page === 1 || page === totalPages || 
                            (page >= currentPage - 1 && page <= currentPage + 1);
                          
                          if (!showPage) {
                            // Show ellipsis
                            if (page === currentPage - 2 || page === currentPage + 2) {
                              return (
                                <span key={page} className="px-2 py-1 text-muted-foreground">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          }
                          
                          return (
                            <Button
                              key={page}
                              variant={isCurrentPage ? "default" : "outline"}
                              size="icon"
                              onClick={() => goToPage(page)}
                              className={isCurrentPage ? "bg-primary text-primary-foreground" : ""}
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No questions found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Leaderboard */}
          <div className="lg:col-span-1" data-leaderboard>
            <SimplifiedLeaderboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
