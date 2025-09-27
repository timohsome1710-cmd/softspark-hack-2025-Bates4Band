import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Send, MessageCircle, X } from "lucide-react";

interface MobileChatComposerProps {
  message: string;
  setMessage: (message: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const MobileChatComposer = ({ message, setMessage, onSend, disabled = false, placeholder = "Type a message..." }: MobileChatComposerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      onSend();
      setIsOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 justify-start text-muted-foreground"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          {placeholder}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[80vh]">
        <DrawerHeader className="flex flex-row items-center justify-between border-b">
          <DrawerTitle>Write your message</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex-1 p-4 flex flex-col">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            className="flex-1 min-h-[200px] resize-none text-base"
            onKeyDown={handleKeyPress}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-4">
            <DrawerClose asChild>
              <Button variant="outline">
                Cancel
              </Button>
            </DrawerClose>
            <Button 
              onClick={handleSend}
              disabled={disabled || !message.trim()}
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileChatComposer;