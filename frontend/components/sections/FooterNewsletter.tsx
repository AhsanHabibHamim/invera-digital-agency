"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";

export default function FooterNewsletter({
  title,
  description,
  placeholder,
  buttonText,
  successMessage,
}: {
  title: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("submitting");
    setMessage("");
    try {
      const res = await api.post("/leads", {
        contactName: value.split("@")[0] || value,
        email: value,
        source: "newsletter",
        message: title || "Newsletter subscription",
      });
      if (!res.success) {
        setStatus("error");
        setMessage(
          getErrorMessage(res, "Subscription failed. Please try again."),
        );
        return;
      }
      setStatus("success");
      setMessage(successMessage || "Thanks for subscribing!");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(
        getErrorMessage(err, "Subscription failed. Please try again."),
      );
    }
  };

  return (
    <div>
      <div className="mb-sm text-label text-foreground/40">{title}</div>
      {description && (
        <p className="mb-sm max-w-72 text-body-small text-foreground/50">
          {description}
        </p>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm items-center gap-2xs"
      >
        <input
          type="email"
          className="input flex-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder || "Enter your email"}
          aria-label={title}
        />
        <button
          type="submit"
          className="btn btn-primary btn-md shrink-0"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{buttonText || "Subscribe"}</span>
        </button>
      </form>
      {status === "success" && (
        <p
          className="mt-sm flex items-center gap-1 text-small text-success"
          role="status"
        >
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {message}
        </p>
      )}
      {status === "error" && (
        <p
          className="mt-sm flex items-center gap-1 text-small text-destructive"
          role="alert"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {message}
        </p>
      )}
    </div>
  );
}
