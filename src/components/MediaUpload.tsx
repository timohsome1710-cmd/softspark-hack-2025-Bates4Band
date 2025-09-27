import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Image, Video, Calculator, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaUploadProps {
  onMediaChange: (files: string[], types: string[]) => void;
  onLatexChange: (latex: string) => void;
  initialFiles?: string[];
  initialTypes?: string[];
  initialLatex?: string;
}

const MediaUpload = ({ 
  onMediaChange, 
  onLatexChange, 
  initialFiles = [], 
  initialTypes = [],
  initialLatex = "" 
}: MediaUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(initialFiles);
  const [fileTypes, setFileTypes] = useState<string[]>(initialTypes);
  const [latex, setLatex] = useState(initialLatex);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newFiles: string[] = [];
    const newTypes: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('question-media')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('question-media')
          .getPublicUrl(filePath);

        newFiles.push(data.publicUrl);
        newTypes.push(file.type.startsWith('image/') ? 'image' : 'video');
      }

      const updatedFiles = [...uploadedFiles, ...newFiles];
      const updatedTypes = [...fileTypes, ...newTypes];
      
      setUploadedFiles(updatedFiles);
      setFileTypes(updatedTypes);
      onMediaChange(updatedFiles, updatedTypes);

      toast({
        title: "Success",
        description: `${newFiles.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    const updatedTypes = fileTypes.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    setFileTypes(updatedTypes);
    onMediaChange(updatedFiles, updatedTypes);
  };

  const handleLatexChange = (value: string) => {
    setLatex(value);
    onLatexChange(value);
  };

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div>
        <Label htmlFor="media-upload" className="flex items-center gap-2 mb-2">
          <Upload className="h-4 w-4" />
          Upload Media (Images/Videos)
        </Label>
        <Input
          id="media-upload"
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileUpload}
          disabled={uploading}
        />
      </div>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Uploaded Files:</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {uploadedFiles.map((fileUrl, index) => (
              <Card key={index} className="relative p-2">
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                {fileTypes[index] === 'image' ? (
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    <img 
                      src={fileUrl} 
                      alt="Uploaded" 
                      className="h-16 w-16 object-cover rounded"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    <video 
                      src={fileUrl} 
                      className="h-16 w-16 object-cover rounded"
                      controls
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* LaTeX Input */}
      <div>
        <Label htmlFor="latex-input" className="flex items-center gap-2 mb-2">
          <Calculator className="h-4 w-4" />
          LaTeX Mathematical Content
        </Label>
        <Textarea
          id="latex-input"
          placeholder="Enter LaTeX code here... e.g., \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}"
          value={latex}
          onChange={(e) => handleLatexChange(e.target.value)}
          rows={3}
        />
        {latex && (
          <div className="mt-2 p-3 bg-muted rounded-md">
            <Badge variant="outline" className="mb-2">LaTeX Preview:</Badge>
            <div className="font-mono text-sm bg-background p-2 rounded border">
              {latex}
            </div>
          </div>
        )}
      </div>

      {uploading && (
        <div className="text-sm text-muted-foreground">
          Uploading files...
        </div>
      )}
    </div>
  );
};

export default MediaUpload;