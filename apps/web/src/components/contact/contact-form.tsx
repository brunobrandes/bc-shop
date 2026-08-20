"use client";

import { type FormEvent, useEffect, useState } from "react";
import {
  contactReasons,
  supportedTimezones,
  type SupportedTimezone,
} from "@/lib/contact/schedule-call";
import type { SupportedCurrency } from "@/lib/currency/currency";

type Feedback = { type: "success" } | { type: "error"; message: string } | null;

const timezoneLabels = [
  "São Paulo / Brasília (UTC-03:00)",
  "New York",
  "Los Angeles",
  "London",
  "Lisbon",
  "Madrid",
] as const;

export function ContactForm({ currency }: { currency: SupportedCurrency }) {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [mode, setMode] = useState<"now" | "scheduled">("now");
  const [timezone, setTimezone] =
    useState<SupportedTimezone>("America/Sao_Paulo");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (supportedTimezones.includes(browserTimezone as SupportedTimezone))
        setTimezone(browserTimezone as SupportedTimezone);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    const form = event.currentTarget;
    const values = new FormData(form);

    try {
      const response = await fetch("/api/contact/call", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: values.get("name"),
          country: "US",
          phone: values.get("phone"),
          reason: values.get("reason"),
          message: values.get("message"),
          mode,
          currency,
          scheduledDate:
            mode === "scheduled" ? values.get("scheduledDate") : undefined,
          scheduledTime:
            mode === "scheduled" ? values.get("scheduledTime") : undefined,
          timezone: mode === "scheduled" ? timezone : undefined,
          consent: values.get("consent") === "on",
        }),
      });
      const result = (await response.json()) as {
        error?: { message?: string };
      };
      if (!response.ok) {
        setFeedback({
          type: "error",
          message:
            result.error?.message ??
            "We could not request the call. Please try again.",
        });
        return;
      }
      form.reset();
      setFeedback({ type: "success" });
    } catch {
      setFeedback({
        type: "error",
        message: "Could not connect to the service. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (feedback?.type === "success")
    return (
      <div className="contact-success" role="status">
        <span aria-hidden="true">✓</span>
        <h2>Call scheduled!</h2>
        <p>We will contact you at the requested time.</p>
        <button
          className="button button--accent"
          type="button"
          onClick={() => setFeedback(null)}
        >
          Request another call
        </button>
      </div>
    );

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <fieldset className="call-mode field--wide">
        <legend>How would you like to talk to us?</legend>
        <div>
          <label>
            <input
              type="radio"
              name="mode"
              value="now"
              checked={mode === "now"}
              onChange={() => setMode("now")}
            />
            <span>Call me now</span>
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              value="scheduled"
              checked={mode === "scheduled"}
              onChange={() => setMode("scheduled")}
            />
            <span>Schedule a call</span>
          </label>
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          maxLength={100}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone number</label>
        <div className="phone-field">
          <span>
            <span role="img" aria-label="United States">
              🇺🇸
            </span>{" "}
            +1
          </span>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel-national"
            inputMode="tel"
            placeholder="(415) 555-2671"
            required
          />
        </div>
        <small>Enter a United States phone number.</small>
      </div>
      <div className="field field--wide">
        <label htmlFor="reason">Contact reason</label>
        <select id="reason" name="reason" defaultValue="" required>
          <option value="" disabled>
            Select an option
          </option>
          {contactReasons.map((reason) => (
            <option key={reason}>{reason}</option>
          ))}
        </select>
      </div>
      <div className="field field--wide">
        <label htmlFor="message">
          Message <span>(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={1000}
          placeholder="Tell us briefly what you need."
        />
      </div>
      {mode === "scheduled" && (
        <fieldset className="schedule-fields field--wide">
          <legend>When should we call?</legend>
          <p>Choose the time zone that applies to your selected local time.</p>
          <div>
            <label>
              Date
              <input name="scheduledDate" type="date" required />
            </label>
            <label>
              Time
              <input name="scheduledTime" type="time" required />
            </label>
            <label>
              Time zone
              <select
                name="timezone"
                value={timezone}
                onChange={(event) =>
                  setTimezone(event.target.value as SupportedTimezone)
                }
                required
              >
                {supportedTimezones.map((value, index) => (
                  <option key={value} value={value}>
                    {timezoneLabels[index]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>
      )}
      <label className="consent field--wide">
        <input name="consent" type="checkbox" required />
        <span>
          I agree to receive a call from BC-Shop at the phone number and time
          provided.
        </span>
      </label>
      {feedback?.type === "error" && (
        <p className="form-error field--wide" role="alert">
          {feedback.message}
        </p>
      )}
      <button
        className="button button--accent contact-form__submit field--wide"
        type="submit"
        disabled={submitting}
      >
        {submitting
          ? "Requesting…"
          : mode === "now"
            ? "Call me now"
            : "Schedule call"}
      </button>
    </form>
  );
}
