import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const useQuestionSubmit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getEXPReward = (difficulty: string) => {
    const rewards = { easy: 50, medium: 100, hard: 150 };
    return rewards[difficulty as keyof typeof rewards] || 50;
  };

  const awardEXP = async (userId: string, difficulty: string) => {
    try {
      const expReward = getEXPReward(difficulty);
      
      // Get current stats
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('exp_points, seasonal_exp, total_exp, questions_asked')
        .eq('user_id', userId)
        .single();

      if (currentStats) {
        // Update existing stats  
        await supabase
          .from('user_stats')
          .update({
            exp_points: currentStats.exp_points + expReward,
            seasonal_exp: currentStats.seasonal_exp + expReward,
            total_exp: (currentStats.total_exp || 0) + expReward,
          })
          .eq('user_id', userId);

        // Update questions_asked count separately
        await supabase
          .from('user_stats')
          .update({
            questions_asked: (currentStats as any).questions_asked + 1 || 1
          })
          .eq('user_id', userId);
      } else {
        // Create new stats record
        await supabase
          .from('user_stats')
          .insert({
            user_id: userId,
            exp_points: expReward,
            seasonal_exp: expReward,
            total_exp: expReward,
            level: 1,
            trophy_rank: 'bronze',
            questions_asked: 1
          });
      }
    } catch (error) {
      console.error('Error awarding EXP:', error);
    }
  };

  const submitQuestion = async (questionData: {
    title: string;
    content: string;
    category: string;
    difficulty: string;
    latex_content?: string;
    media_files?: string[];
    media_types?: string[];
  }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to ask a question.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: question, error } = await supabase
        .from("questions")
        .insert({
          ...questionData,
          author_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Award EXP for asking a question
      await awardEXP(user.id, questionData.difficulty);

      toast({
        title: "Question submitted! 🎉",
        description: `Your question has been posted. You earned ${getEXPReward(questionData.difficulty)} EXP!`,
      });

      // Navigate to the question
      navigate(`/question/${question.id}`);
    } catch (error) {
      console.error("Error submitting question:", error);
      toast({
        title: "Error",
        description: "Failed to submit question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitQuestion,
    isSubmitting,
  };
};