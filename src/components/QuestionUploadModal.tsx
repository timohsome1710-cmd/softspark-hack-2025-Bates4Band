import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload, Image, Video, FileText, X, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import MediaUpload from "./MediaUpload";

interface QuestionUploadModalProps {
  trigger?: React.ReactNode;
}

const QuestionUploadModal = ({ trigger }: QuestionUploadModalProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    difficulty: "",
  });
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [mediaTypes, setMediaTypes] = useState<string[]>([]);
  const [latexContent, setLatexContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: "math", label: "Mathematics", icon: "🔢", exp: { easy: 50, medium: 100, hard: 150 } },
    { value: "science", label: "Science", icon: "🔬", exp: { easy: 50, medium: 100, hard: 150 } },
    { value: "social", label: "Social Studies", icon: "🏛️", exp: { easy: 50, medium: 100, hard: 150 } },
  ];

  const difficulties = [
    { value: "easy", label: "Easy", description: "Basic concepts, quick answers", exp: 50, color: "bg-exp-easy" },
    { value: "medium", label: "Medium", description: "Requires some thinking", exp: 100, color: "bg-exp-medium" },
    { value: "hard", label: "Hard", description: "Complex problems, detailed explanations", exp: 150, color: "bg-exp-hard" },
  ];

  const selectedCategory = categories.find(c => c.value === formData.category);
  const selectedDifficulty = difficulties.find(d => d.value === formData.difficulty);
  const expectedExp = selectedCategory && selectedDifficulty ? 
    selectedCategory.exp[selectedDifficulty.value as keyof typeof selectedCategory.exp] : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.category || !formData.difficulty) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would save to Supabase with media and LaTeX
      console.log("Saving question with media:", mediaFiles, "and LaTeX:", latexContent);
      
      toast({
        title: "Question Posted! 🎉",
        description: `Your question is now live and students can start answering to help you earn ${expectedExp} EXP!`,
      });
      
      // Reset form
      setFormData({ title: "", content: "", category: "", difficulty: "" });
      setMediaFiles([]);
      setMediaTypes([]);
      setLatexContent("");
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:from-primary/90 hover:to-secondary/90">
            <Plus className="mr-2 h-4 w-4" />
            Ask Question
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Ask a Question
          </DialogTitle>
          <DialogDescription>
            Get help from your fellow USYD students. The more detailed your question, the better answers you'll receive!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Question Title *</Label>
            <Input
              id="title"
              placeholder="e.g., How do I solve quadratic equations?"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Be specific and clear. Good titles get more answers!
            </p>
          </div>

          {/* Category & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((difficulty) => (
                    <SelectItem key={difficulty.value} value={difficulty.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{difficulty.label}</span>
                        <Badge className={`${difficulty.color} text-white text-xs ml-2`}>
                          {difficulty.exp} EXP
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* EXP Preview */}
          {selectedCategory && selectedDifficulty && (
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{selectedCategory.icon}</span>
                    <div>
                      <p className="font-medium">
                        {selectedCategory.label} • {selectedDifficulty.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedDifficulty.description}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${selectedDifficulty.color} text-white`}>
                    {expectedExp} EXP Reward
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Question Details *</Label>
            <Textarea
              id="content"
              placeholder="Describe your question in detail. Include what you've tried, what you're struggling with, and any specific requirements..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="min-h-[120px] text-base"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 50 characters. More detail = better answers!
            </p>
          </div>

          {/* Media Upload */}
          <div className="space-y-3">
            <MediaUpload
              onMediaChange={(files, types) => {
                setMediaFiles(files);
                setMediaTypes(types);
              }}
              onLatexChange={setLatexContent}
              initialFiles={mediaFiles}
              initialTypes={mediaTypes}
              initialLatex={latexContent}
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Questions are reviewed by admins before going live
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isSubmitting ? "Posting..." : "Post Question"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionUploadModal;