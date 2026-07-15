"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiFetch from "@/lib/api/client";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await apiFetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setStatus("sent");
    } catch (e) {
      setStatus("error");
    }
  };

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-4xl font-semibold text-white">Contact</h1>
      <p className="mt-4 text-zinc-400">Questions, feedback, or enterprise inquiries.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
        <textarea
          className="min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
        />
        <Button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send message"}</Button>
        {status === "sent" && <p className="text-sm text-emerald-400">Message sent. We&apos;ll get back to you soon.</p>}
        {status === "error" && <p className="text-sm text-rose-400">Failed to send. Email hello@elyto.in directly.</p>}
      </form>
    </main>
  );
}
