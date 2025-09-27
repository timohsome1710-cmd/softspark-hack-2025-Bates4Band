import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, MessageCircle, Award, Clock, CheckCircle2, Video, FileText } from "lucide-react";
import { Link } from "react-router-dom";

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

interface QuestionCardProps {
  question: Question;
}

const QuestionCard = ({ question }: QuestionCardProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return "bg-exp-easy text-white";
      case "medium": return "bg-exp-medium text-white";
      case "hard": return "bg-exp-hard text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "mathematics": case "math": return "🔢";
      case "science": return "🔬";
      case "social studies": case "social": return "🏛️";
      default: return "📚";
    }
  };

  const getExpPoints = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return 100;
      case "medium": return 150;
      case "hard": return 200;
      default: return 100;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  return (
    <Link to={`/question/${question.id}`} className="block">
      <Card className="group hover:shadow-lg transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-muted/20 hover:scale-[1.02] cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getCategoryIcon(question.category)}</span>
                <Badge variant="outline" className="text-xs">
                  {question.category}
                </Badge>
                <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty} • {getExpPoints(question.difficulty)} EXP
                </Badge>
                {question.has_approved_answer && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-300">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Solved
                  </Badge>
                )}
                {question.has_teacher_approved_answer && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Teacher Approved
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {question.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {question.content}
              </p>
              
              {/* Media Preview */}
              {question.media_urls && question.media_urls.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {question.media_urls.slice(0, 3).map((url, index) => (
                    <div key={index} className="relative">
                      {question.media_types?.[index] === 'image' ? (
                        <img 
                          src={url} 
                          alt="Question media" 
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                          <Video className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {question.media_urls.length > 3 && (
                    <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center text-xs">
                      +{question.media_urls.length - 3}
                    </div>
                  )}
                </div>
              )}
              
              {/* LaTeX Preview */}
              {question.latex_content && (
                <Badge variant="outline" className="mt-2 text-xs bg-secondary/20">
                  <FileText className="h-3 w-3 mr-1" />
                  Mathematical Content
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardFooter className="pt-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={question.author?.avatar_url || ""} alt={question.author?.display_name || "Unknown"} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xs font-bold">
                    {question.author?.display_name?.split(' ').map(word => word[0]?.toUpperCase()).join('').slice(0, 2) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-sm font-medium">{question.author?.display_name || "Unknown User"}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{question.answer_count || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs">{getTimeAgo(question.created_at)}</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="hover:bg-primary hover:text-primary-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Navigate to question detail
                  window.location.href = `/question/${question.id}`;
                }}
              >
                Answer
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default QuestionCard;