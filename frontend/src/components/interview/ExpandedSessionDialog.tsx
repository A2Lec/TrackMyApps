import { Bot, Mic, MicOff, Minimize2, Send } from 'lucide-react';
import type { InterviewMessage } from '@/services/interviewSimulation.service';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { MessageBubble } from './MessageBubble';

interface ExpandedSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  interviewerLabel: string;
  messages: InterviewMessage[];
  message: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  isSending: boolean;
  isListening: boolean;
  onToggleDictation: () => void;
}

/** Full-screen view of the conversation, for long answers */
export function ExpandedSessionDialog({
  open,
  onOpenChange,
  title,
  interviewerLabel,
  messages,
  message,
  onMessageChange,
  onSend,
  isSending,
  isListening,
  onToggleDictation,
}: ExpandedSessionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-full h-[92vh] p-0 gap-0 flex flex-col rounded-lg overflow-hidden">
        <DialogHeader className="p-4 border-b border-border/40 flex-row items-center justify-between space-y-0 shrink-0">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            {title}
          </DialogTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
            <Minimize2 className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4 sm:p-6">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} interviewerLabel={interviewerLabel} expanded />
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/40 bg-card shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSend();
            }}
            className="max-w-3xl mx-auto flex items-end gap-2"
          >
            <Textarea
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Rédigez ou dictez votre réponse..."
              disabled={isSending}
              rows={1}
              className="min-h-[44px] max-h-[160px] resize-none text-sm py-2.5 rounded-lg border-border/80"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onToggleDictation}
              className={cn('h-11 w-11 rounded-lg shrink-0', isListening && 'bg-destructive text-white')}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button type="submit" size="icon" disabled={isSending || !message.trim()} className="h-11 w-11 rounded-lg shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
