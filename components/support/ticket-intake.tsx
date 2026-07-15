"use client";

import { useState } from "react";
import { MessageCircle, Send, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type TicketStage = "welcome" | "input" | "confirmation" | "submitted";

interface SupportTicketIntakeProps {
  onSubmit?: (issue: string) => Promise<void>;
}

export function SupportTicketIntake({ onSubmit }: SupportTicketIntakeProps) {
  const [stage, setStage] = useState<TicketStage>("welcome");
  const [issue, setIssue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState("");

  const handleSubmit = async () => {
    if (!issue.trim()) return;

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(issue);
      }
      // Generate mock ticket ID
      setTicketId(`TKT-${Date.now().toString().slice(-8)}`);
      setStage("submitted");
    } catch (error) {
      console.error("Failed to submit ticket", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart = () => {
    setStage("input");
  };

  return (
    <div className="space-y-4">
      {stage === "welcome" && (
        <div className="rounded-dense bg-white/[0.02] border border-white/10 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <MessageCircle className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-base font-semibold text-white">Welcome!</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Please explain your issue in detail so our support team can best assist you.
              </p>
            </div>
          </div>
          <Button
            onClick={handleStart}
            className="w-full rounded-dense bg-cyan-600 hover:bg-cyan-700"
          >
            Start Chat <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {stage === "input" && (
        <div className="rounded-dense bg-white/[0.02] border border-white/10 p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Describe your issue</label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Please provide details about what you're experiencing..."
              className="w-full px-3 py-2 rounded-dense bg-white/[0.05] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-none"
              rows={5}
            />
            <p className="text-xs text-zinc-500 mt-2">
              {issue.length} characters
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStage("welcome")}
              className="flex-1 rounded-dense"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!issue.trim() || isSubmitting}
              className="flex-1 rounded-dense bg-cyan-600 hover:bg-cyan-700"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
              <Send className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {stage === "submitted" && (
        <div className="rounded-dense bg-white/[0.02] border border-white/10 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-base font-semibold text-white">Ticket submitted</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Our support team will see your issue shortly. You can continue managing your dashboard in the meantime.
              </p>
              <div className="mt-3 p-2 rounded-dense bg-white/[0.05] border border-white/10">
                <p className="text-xs text-zinc-500">Ticket ID</p>
                <p className="text-sm font-mono text-cyan-300">{ticketId}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-2">
            <Button
              onClick={() => setStage("welcome")}
              variant="outline"
              className="w-full rounded-dense"
            >
              Submit another issue
            </Button>
            <Button className="w-full rounded-dense bg-cyan-600 hover:bg-cyan-700">
              View all tickets
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact chat-style ticket intake component
 * Can be embedded in a modal or sidebar
 */
export function CompactTicketIntake() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; content: string }>>([
    {
      role: "ai",
      content: "Welcome! Please describe your issue and our team will assist you shortly."
    }
  ]);

  const handleSend = () => {
    if (!message.trim()) return;

    setMessages([...messages, { role: "user", content: message }]);
    setMessage("");

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Thank you for reporting this. Our support team will review your issue and respond within 2 hours."
        }
      ]);
    }, 500);
  };

  return (
    <div className="flex flex-col h-96 rounded-dense bg-white/[0.02] border border-white/10 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-dense text-sm ${
                msg.role === "user"
                  ? "bg-cyan-600/20 border border-cyan-400/30 text-cyan-200"
                  : "bg-white/[0.05] border border-white/10 text-zinc-300"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-3 flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your issue..."
          className="flex-1 px-3 py-2 rounded-dense bg-white/[0.05] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-sm"
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim()}
          size="sm"
          className="rounded-dense px-3"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
