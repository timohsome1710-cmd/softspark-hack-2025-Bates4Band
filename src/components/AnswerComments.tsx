import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  content: string;
  author_id: string;
  answer_id: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface AnswerCommentsProps {
  answerId: string;
}

const AnswerComments = ({ answerId }: AnswerCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyText, setReplyText] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [answerId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("answer_comments")
        .select(`
          *,
          profiles!answer_comments_author_id_fkey(display_name, avatar_url)
        `)
        .eq("answer_id", answerId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      toast({
        title: "Reply required",
        description: "Please write your reply before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to reply.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("answer_comments")
        .insert({
          answer_id: answerId,
          author_id: user.id,
          content: replyText.trim(),
        })
        .select(`
          *,
          profiles!answer_comments_author_id_fkey(display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, data]);
      setReplyText("");
      setShowReplyForm(false);
      
      toast({
        title: "Reply submitted! 📝",
        description: "Your reply has been added to the answer.",
      });
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast({
        title: "Error",
        description: "Failed to submit reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  return (
    <div className="mt-4 space-y-3">
      {/* Existing Comments */}
      {comments.length > 0 && (
        <div className="space-y-3 pl-4 border-l-2 border-muted">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={comment.profiles?.avatar_url} alt={comment.profiles?.display_name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xs">
                    {comment.profiles?.display_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{comment.profiles?.display_name || 'Unknown User'}</span>
                    <span className="text-xs text-muted-foreground">
                      {getTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Button/Form */}
      {user ? (
        !showReplyForm ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplyForm(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Reply
          </Button>
        ) : (
          <Card className="bg-muted/20">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <Textarea
                  placeholder="Write your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[80px] bg-background"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitReply}
                    disabled={submitting}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? "Replying..." : "Reply"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <p className="text-xs text-muted-foreground">Please log in to reply.</p>
      )}
    </div>
  );
};

export default AnswerComments;
