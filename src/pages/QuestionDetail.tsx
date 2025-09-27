import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ThumbsUp, ThumbsDown, MessageCircle, Award, CheckCircle2, Clock, Send, Image, Video, FileText, Home, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock question data
const mockQuestionData = {
  "1": {
    id: "1",
    title: "How to solve quadratic equations using the quadratic formula?",
    content: "I'm struggling with understanding when and how to apply the quadratic formula. Can someone explain the steps with an example? For instance, how would I solve: x² + 5x + 6 = 0?\n\nI know the formula is x = (-b ± √(b²-4ac)) / 2a, but I get confused with the steps and when to use + or - in the ± symbol.",
    category: "Math" as const,
    difficulty: "Medium" as const,
    exp: 100,
    author: {
      name: "Sarah Wilson",
      avatar: "",
      level: 8,
    },
    isVerified: true,
    timeAgo: "2 hours ago",
    answers: [
      {
        id: "1",
        content: "Great question! Let me walk you through the quadratic formula step by step.\n\nFor x² + 5x + 6 = 0:\n1. Identify a=1, b=5, c=6\n2. Calculate discriminant: b²-4ac = 25-24 = 1\n3. Apply formula: x = (-5 ± √1) / 2\n4. Solve: x = (-5 ± 1) / 2\n5. So x = -2 or x = -3\n\nThe ± means you get two solutions - use both + and - to find both roots!",
        author: {
          name: "Dr. Alex Chen",
          avatar: "",
          level: 25,
          verified: true,
        },
        timeAgo: "1 hour ago",
        upvotes: 12,
        isAccepted: true,
      },
      {
        id: "2", 
        content: "I'll add to Alex's explanation with a visual approach. You can also factor this: x² + 5x + 6 = (x + 2)(x + 3) = 0. This gives the same solutions: x = -2 and x = -3. Sometimes factoring is easier than the quadratic formula!",
        author: {
          name: "Maria Santos",
          avatar: "",
          level: 16,
        },
        timeAgo: "45 minutes ago",
        upvotes: 8,
        isAccepted: false,
      }
    ]
  }
};

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [answerText, setAnswerText] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [question, setQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestionAndAnswers = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Fetch question
        const { data: question, error: questionError } = await supabase
          .from("questions")
          .select(`
            *,
            profiles!questions_author_id_fkey (
              display_name,
              avatar_url
            )
          `)
          .eq("id", id)
          .maybeSingle();

        if (questionError) throw questionError;
        if (!question) {
          setError("Question not found");
          return;
        }
        setQuestion(question);

        // Fetch answers
        const { data: answers, error: answersError } = await supabase
          .from("answers")
          .select(`
            *,
            profiles!answers_author_id_fkey (
              display_name,
              avatar_url
            )
          `)
          .eq("question_id", id)
          .order("created_at", { ascending: false });

        if (answersError) throw answersError;
        setAnswers(answers || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Question not found");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionAndAnswers();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Question not found</h1>
          <Link to="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return "bg-green-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      case "hard": return "bg-red-500 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "math": return "🔢";
      case "mathematics": return "🔢";
      case "science": return "🔬";
      case "social": return "🏛️";
      case "social studies": return "🏛️";
      default: return "📚";
    }
  };

  const handleDeleteQuestion = async () => {
    if (!question || !user || question.author_id !== user.id) return;
    
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Question deleted",
        description: "Your question has been successfully deleted.",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      toast({
        title: "Answer required",
        description: "Please write your answer before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit an answer.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingAnswer(true);
    
    try {
      const { data, error } = await supabase
        .from("answers")
        .insert({
          question_id: id,
          author_id: user.id,
          content: answerText.trim(),
        })
        .select(`
          *,
          profiles!answers_author_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Add the new answer to the list
      setAnswers(prev => [data, ...prev]);
      setAnswerText("");
      
      toast({
        title: "Answer submitted! 🎉",
        description: "Thank you for helping a fellow student!",
      });
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingAnswer(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <Home className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Question */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{getCategoryIcon(question.category)}</span>
                       <Badge variant="outline" className="text-xs">
                         {question.category}
                       </Badge>
                       <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
                         {question.difficulty} • 100 EXP
                       </Badge>
                       {question.is_verified && (
                        <Badge variant="secondary" className="text-xs bg-level-gold/20 text-level-gold border-level-gold/30">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-4">
                      {question.title}
                    </h1>
                  </div>
                  {user && question.author_id === user.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteQuestion}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none mb-6">
                  <p className="text-foreground whitespace-pre-line leading-relaxed">
                    {question.content}
                  </p>
                  
                  {/* Display LaTeX content */}
                  {question.latex_content && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">LaTeX Content:</h4>
                      <code className="text-sm">{question.latex_content}</code>
                    </div>
                  )}
                  
                  {/* Display media files */}
                  {(question.images?.length > 0 || question.videos?.length > 0 || question.media_files?.length > 0) && (
                    <div className="mt-6 space-y-4">
                      {/* Images */}
                      {question.images?.map((image: string, index: number) => (
                        <div key={index} className="border rounded-lg p-2">
                          <img src={image} alt={`Question image ${index + 1}`} className="max-w-full h-auto rounded" />
                        </div>
                      ))}
                      
                      {/* Videos */}
                      {question.videos?.map((video: string, index: number) => (
                        <div key={index} className="border rounded-lg p-2">
                          <video controls className="max-w-full h-auto rounded">
                            <source src={video} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ))}
                      
                      {/* Media files */}
                      {question.media_files?.map((file: string, index: number) => {
                        const mediaType = question.media_types?.[index] || 'file';
                        return (
                          <div key={index} className="border rounded-lg p-2">
                            {mediaType === 'image' ? (
                              <img src={file} alt={`Media ${index + 1}`} className="max-w-full h-auto rounded" />
                            ) : mediaType === 'video' ? (
                              <video controls className="max-w-full h-auto rounded">
                                <source src={file} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <a href={file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                View File {index + 1}
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <Separator className="my-6" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Avatar className="h-8 w-8">
                       <AvatarImage src={question.profiles?.avatar_url} alt={question.profiles?.display_name} />
                       <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-sm">
                         {question.profiles?.display_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                       </AvatarFallback>
                     </Avatar>
                     <div>
                       <span className="font-medium">{question.profiles?.display_name || 'Unknown User'}</span>
                       <Badge variant="outline" className="ml-2 text-xs">Lv. 1</Badge>
                     </div>
                   </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                     <Clock className="h-4 w-4" />
                     <span className="text-sm">{new Date(question.created_at).toLocaleDateString()}</span>
                   </div>
                </div>
              </CardContent>
            </Card>

            {/* Answers Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                 <MessageCircle className="h-5 w-5 text-primary" />
                 <h2 className="text-xl font-bold">
                   {answers.length} Answer{answers.length !== 1 ? 's' : ''}
                 </h2>
               </div>

               {answers.length === 0 ? (
                 <Card>
                   <CardContent className="pt-6 text-center text-muted-foreground">
                     <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                     <p>No answers yet. Be the first to help!</p>
                   </CardContent>
                 </Card>
               ) : (
                 <div className="space-y-4">
                   {answers.map((answer) => (
                     <Card key={answer.id}>
                       <CardContent className="pt-6">
                         <div className="flex items-start gap-4">
                           <Avatar className="h-8 w-8">
                             <AvatarImage src={answer.profiles?.avatar_url} alt={answer.profiles?.display_name} />
                             <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-sm">
                               {answer.profiles?.display_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                             </AvatarFallback>
                           </Avatar>
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                               <span className="font-medium">{answer.profiles?.display_name || 'Unknown User'}</span>
                               <Badge variant="outline" className="text-xs">Lv. 1</Badge>
                               <span className="text-xs text-muted-foreground">
                                 {new Date(answer.created_at).toLocaleDateString()}
                               </span>
                               {answer.approved_by_author && (
                                 <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                   <CheckCircle2 className="mr-1 h-3 w-3" />
                                   Accepted
                                 </Badge>
                               )}
                             </div>
                             <p className="text-foreground whitespace-pre-line leading-relaxed">
                               {answer.content}
                             </p>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   ))}
                 </div>
               )}
            </div>

            {/* Answer Form */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Your Answer</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Write your answer here... Be detailed and helpful!"
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    className="min-h-[120px]"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Image className="h-4 w-4 mr-2" />
                        Add Image
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4 mr-2" />
                        Add Video
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Add Notes
                      </Button>
                    </div>
                    
                     <Button 
                       onClick={handleSubmitAnswer}
                       disabled={submittingAnswer}
                       className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                     >
                       <Send className="h-4 w-4 mr-2" />
                       {submittingAnswer ? "Submitting..." : "Submit Answer (+100 EXP)"}
                     </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Question Stats</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Views</span>
                  <span className="font-medium">127</span>
                </div>
                 <div className="flex items-center justify-between">
                   <span className="text-muted-foreground">Answers</span>
                   <span className="font-medium">{answers.length}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-muted-foreground">EXP Reward</span>
                   <Badge className={getDifficultyColor(question.difficulty)}>
                     100 EXP
                   </Badge>
                 </div>
                
                <Separator />
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Help a fellow USYD student!
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-secondary to-accent text-primary"
                    onClick={() => document.querySelector('textarea')?.focus()}
                  >
                    Write Answer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetail;