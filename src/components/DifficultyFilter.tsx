import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface DifficultyFilterProps {
  selectedDifficulty: string;
  onDifficultyChange: (difficulty: string) => void;
}

const difficulties = [
  { 
    id: "all", 
    name: "All Levels", 
    exp: "", 
    color: "bg-slate-700 text-white", 
    dotColor: "bg-white",
    activeClass: "bg-slate-700 text-white"
  },
  { 
    id: "easy", 
    name: "Easy", 
    exp: "50 EXP", 
    color: "bg-muted hover:bg-muted/80", 
    dotColor: "bg-green-500",
    activeClass: "bg-green-500/20 border-green-500"
  },
  { 
    id: "medium", 
    name: "Medium", 
    exp: "100 EXP", 
    color: "bg-muted hover:bg-muted/80", 
    dotColor: "bg-orange-500",
    activeClass: "bg-orange-500/20 border-orange-500"
  },
  { 
    id: "hard", 
    name: "Hard", 
    exp: "150 EXP", 
    color: "bg-muted hover:bg-muted/80", 
    dotColor: "bg-red-500",
    activeClass: "bg-red-500/20 border-red-500"
  },
];

const DifficultyFilter = ({ selectedDifficulty, onDifficultyChange }: DifficultyFilterProps) => {
  return (
    <Card className="bg-gradient-to-br from-card to-background/50">
      <CardHeader>
        <CardTitle className="text-foreground font-bold">
          Difficulty
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {difficulties.map((difficulty) => {
            const isSelected = selectedDifficulty === difficulty.id;
            const isAllLevels = difficulty.id === "all";
            
            return (
              <Button
                key={difficulty.id}
                variant="ghost"
                className={`w-full justify-start gap-3 h-auto p-4 rounded-xl border transition-all duration-200 ${
                  isSelected 
                    ? isAllLevels 
                      ? "bg-slate-700 text-white hover:bg-slate-700/90"
                      : difficulty.activeClass
                    : "bg-muted/30 hover:bg-muted/50 border-muted"
                }`}
                onClick={() => onDifficultyChange(difficulty.id)}
              >
                <div className={`w-4 h-4 rounded-full ${
                  isSelected && isAllLevels ? "bg-white" : difficulty.dotColor
                }`} />
                <div className="flex-1 text-left">
                  <div className="font-medium">{difficulty.name}</div>
                  {difficulty.exp && (
                    <div className={`text-sm ${
                      isSelected && !isAllLevels ? "text-muted-foreground" : "text-muted-foreground"
                    }`}>
                      {difficulty.exp}
                    </div>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DifficultyFilter;