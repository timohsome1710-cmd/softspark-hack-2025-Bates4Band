import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers3, BookOpen, Calculator, FlaskConical, University } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CategoryCount {
  category: string;
  count: number;
  icon: string;
  color: string;
}

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    const loadCategoryCounts = async () => {
      try {
        // Get total questions count
        const { count: total } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true });

        setTotalQuestions(total || 0);

        // Get questions by category with exact count
        const { data: mathData, count: mathCount } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .ilike("category", "%math%");

        const { data: scienceData, count: scienceCount } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .ilike("category", "%science%");

        const { data: socialData, count: socialCount } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .or("category.ilike.%social%,category.ilike.%studies%");

        setCategoryCounts([
          { 
            category: "Mathematics", 
            count: mathCount || 0,
            icon: "🔢",
            color: "bg-blue-500"
          },
          { 
            category: "Science", 
            count: scienceCount || 0,
            icon: "🔬",
            color: "bg-green-500"
          },
          { 
            category: "Social Studies", 
            count: socialCount || 0,
            icon: "🏛️",
            color: "bg-purple-500"
          },
        ]);
      } catch (error) {
        console.error("Error loading category counts:", error);
      }
    };

    loadCategoryCounts();

    // Set up real-time subscription
    const channel = supabase
      .channel('questions-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'questions'
      }, () => {
        loadCategoryCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="bg-gradient-to-br from-card to-background/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground font-bold">
          Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* All Questions */}
          <div 
            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-all duration-200 shadow-lg ${
              selectedCategory === "all" 
                ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground" 
                : "bg-gradient-to-r from-slate-700 to-slate-800 text-white"
            }`}
            onClick={() => onCategoryChange("all")}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-lg">📚</span>
              </div>
              <span className="font-semibold">All Questions</span>
            </div>
            <Badge className="bg-white/20 text-white font-bold px-3 py-1 rounded-full">
              {totalQuestions}
            </Badge>
          </div>

          {/* Category Items */}
          {categoryCounts.map((category) => {
            const categoryValue = category.category.toLowerCase().includes('math') ? 'mathematics' : 
                                 category.category.toLowerCase().includes('science') ? 'science' : 
                                 category.category.toLowerCase().includes('social') ? 'social studies' : 
                                 category.category.toLowerCase();
            const isSelected = selectedCategory === categoryValue;
            
            return (
              <div
                key={category.category}
                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                  isSelected 
                    ? "bg-primary/20 border-2 border-primary" 
                    : "bg-muted/30 border border-muted hover:bg-muted/50"
                }`}
                onClick={() => onCategoryChange(categoryValue)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg">{category.icon}</span>
                  </div>
                  <span className="font-medium text-foreground">{category.category}</span>
                </div>
                <Badge className={`font-bold px-3 py-1 rounded-full ${
                  isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
                }`}>
                  {category.count}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryFilter;