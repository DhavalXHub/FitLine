import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Zap } from "lucide-react";
import { askAICoach, type ChatMessage } from "@/lib/ai";
import { useAuth } from "@/contexts/AuthContext";

export const AICoach = () => {
  const { userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  type Bubble = { type: "user" | "ai"; content: string };
  const [messages, setMessages] = useState<Bubble[]>([
    {
      type: "ai",
      content:
        "Hey there! 💪 I'm your AI fitness coach. Ask about workouts, plans, nutrition basics, or form cues.",
    },
  ]);

  const chatHistory: ChatMessage[] = useMemo(() => {
    return messages
      .filter((m) => m.content.trim().length > 0)
      .map((m) => ({ role: m.type === "ai" ? "assistant" : "user", content: m.content }));
  }, [messages]);

  const handleSendMessage = async () => {
    const input = message.trim();
    if (!input || isThinking) return;
    setMessage("");
    setMessages((prev) => [...prev, { type: "user", content: input }]);
    setIsThinking(true);
    try {
      const reply = await askAICoach(input, chatHistory, userProfile as any);
      setMessages((prev) => [...prev, { type: "ai", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: "Sorry, I'm having trouble responding right now. Try again in a moment.",
        },
      ]);
    } finally {
      setIsThinking(false);
      // Scroll to bottom after response
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 rounded-full bg-gradient-primary shadow-glow hover:shadow-hero transition-smooth z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed left-3 right-3 bottom-3 sm:left-auto sm:right-6 sm:bottom-6 w-auto sm:w-80 h-[60vh] sm:h-96 max-h-[80vh] bg-gradient-card border-0 shadow-hero z-50 flex flex-col">
          <CardHeader className="bg-gradient-primary text-white rounded-t-lg p-4">
            <div className="flex justify-between items-center">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Zap className="w-5 h-5" />
                AI COACH
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex flex-col flex-1 p-0 min-h-0">
            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      msg.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg text-sm bg-muted text-foreground opacity-80">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about fitness..."
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  variant="default"
                  className="h-10 w-10 bg-primary hover:bg-primary/90"
                  disabled={isThinking}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {import.meta.env.VITE_AI_ENDPOINT ? 'Powered by your AI endpoint' : 'Running local coaching guidance'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};