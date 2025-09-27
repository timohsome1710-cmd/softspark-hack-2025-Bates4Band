import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, MessageSquare, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  friendName?: string;
}

const ChatComposer = ({ 
  value, 
  onChange, 
  onSubmit, 
  placeholder = "Type a message...",
  disabled = false,
  friendName = "friend"
}: ChatComposerProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit();
      setIsOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Mobile version with full-screen drawer
  if (isMobile) {
    return (
      <div className="flex gap-2 items-end p-4 border-t bg-background">
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <div className="flex-1 relative">
              <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                onKeyDown={handleKeyPress}
                className="flex-1 rounded-lg border px-3 py-2 text-sm resize-none min-h-[2.5rem] max-h-[4rem] pr-12"
                readOnly
                onClick={() => setIsOpen(true)}
              />
              <Button 
                onClick={() => setIsOpen(true)}
                size="sm" 
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg h-8 w-8 flex-shrink-0 p-0"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </DrawerTrigger>
          <DrawerContent className="h-[85vh]">
            <DrawerHeader className="flex flex-row items-center justify-between border-b">
              <DrawerTitle>Message {friendName}</DrawerTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerHeader>
            <div className="flex flex-col h-full p-4">
              <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                onKeyDown={handleKeyPress}
                className="flex-1 resize-none border-0 focus-visible:ring-0 text-base p-0"
                autoFocus
              />
              <div className="flex justify-end pt-4 border-t mt-4">
                <Button 
                  onClick={handleSubmit}
                  disabled={!value.trim() || disabled}
                  className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {disabled ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  // Desktop version with dialog
  return (
    <div className="flex gap-2 items-end p-4 border-t bg-background">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="flex-1 relative">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              onKeyDown={handleKeyPress}
              className="flex-1 rounded-lg border px-3 py-2 text-sm resize-none min-h-[2.5rem] max-h-[4rem] pr-12"
            />
            <Button 
              onClick={handleSubmit}
              disabled={!value.trim() || disabled}
              size="sm" 
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg h-8 w-8 flex-shrink-0 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message {friendName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              onKeyDown={handleKeyPress}
              className="min-h-[200px] resize-none text-base"
              autoFocus
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmit}
                disabled={!value.trim() || disabled}
                className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
              >
                <Send className="h-4 w-4 mr-2" />
                {disabled ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatComposer;