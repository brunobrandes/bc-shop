"use client";

import { type FormEvent, useEffect, useState } from "react";
import {
  contactReasons,
  englishContactReasons,
  supportedTimezones,
  type SupportedTimezone,
} from "@/lib/contact/schedule-call";
import type { ContactLocale } from "./contact-page";
import type { SupportedCurrency } from "@/lib/currency/currency";

type Feedback = { type: "success" } | { type: "error"; message: string } | null;

const copy = {
  en: {
    name: "Name",
    preference: "How would you like to talk to us?",
    now: "Call me now",
    scheduled: "Schedule a call",
    phone: "Brazilian phone number",
    phoneHint: "Include the area code.",
    reason: "Contact reason",
    select: "Select an option",
    message: "Message",
    optional: "(optional)",
    placeholder: "Tell us briefly what you need.",
    when: "When should we call?",
    timezone: "Brasília time",
    date: "Date",
    time: "Time",
    timeZone: "Time zone",
    consent:
      "I agree to receive a call from BC-Shop at the phone number and time provided.",
    submitNow: "Call me now",
    submitScheduled: "Schedule call",
    submitting: "Scheduling…",
    successTitle: "Call scheduled!",
    successText: "We will contact you at the requested time.",
    again: "Schedule another call",
    fallback: "We could not schedule the call. Please try again.",
    connection: "Could not connect to the service. Please try again.",
  },
  pt: {
    name: "Nome",
    preference: "Como você prefere falar com a gente?",
    now: "Me ligue agora",
    scheduled: "Agendar uma ligação",
    phone: "Telefone brasileiro",
    phoneHint: "Inclua o DDD.",
    reason: "Motivo do contato",
    select: "Selecione uma opção",
    message: "Mensagem",
    optional: "(opcional)",
    placeholder: "Conte um pouco mais sobre o que você precisa.",
    when: "Quando devemos ligar?",
    timezone: "Horário de Brasília",
    date: "Data",
    time: "Horário",
    timeZone: "Fuso horário",
    consent:
      "Concordo em receber uma ligação da BC-Shop no telefone e horário informados.",
    submitNow: "Receber ligação agora",
    submitScheduled: "Agendar ligação",
    submitting: "Agendando…",
    successTitle: "Ligação agendada!",
    successText: "Vamos entrar em contato no horário solicitado.",
    again: "Agendar outra ligação",
    fallback: "Não foi possível agendar a ligação. Tente novamente.",
    connection:
      "Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.",
  },
} as const;

const timezoneLabels = {
  en: [
    "São Paulo / Brasília (UTC-03:00)",
    "New York",
    "Los Angeles",
    "London",
    "Lisbon",
    "Madrid",
  ],
  pt: [
    "São Paulo / Brasília (UTC-03:00)",
    "Nova York",
    "Los Angeles",
    "Londres",
    "Lisboa",
    "Madri",
  ],
} as const;

export function ContactForm({
  locale,
  currency,
}: {
  locale: ContactLocale;
  currency: SupportedCurrency;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [mode, setMode] = useState<"now" | "scheduled">("now");
  const [timezone, setTimezone] =
    useState<SupportedTimezone>("America/Sao_Paulo");
  const text = copy[locale];
  const reasons = locale === "en" ? englishContactReasons : contactReasons;

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
          phone: values.get("phone"),
          reason: values.get("reason"),
          message: values.get("message"),
          mode,
          locale,
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
          message: result.error?.message ?? text.fallback,
        });
        return;
      }
      form.reset();
      setFeedback({ type: "success" });
    } catch {
      setFeedback({
        type: "error",
        message: text.connection,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (feedback?.type === "success")
    return (
      <div className="contact-success" role="status">
        <span aria-hidden="true">✓</span>
        <h2>{text.successTitle}</h2>
        <p>{text.successText}</p>
        <button
          className="button button--accent"
          type="button"
          onClick={() => setFeedback(null)}
        >
          {text.again}
        </button>
      </div>
    );

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <fieldset className="call-mode field--wide">
        <legend>{text.preference}</legend>
        <div>
          <label>
            <input
              type="radio"
              name="mode"
              value="now"
              checked={mode === "now"}
              onChange={() => setMode("now")}
            />
            <span>{text.now}</span>
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              value="scheduled"
              checked={mode === "scheduled"}
              onChange={() => setMode("scheduled")}
            />
            <span>{text.scheduled}</span>
          </label>
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="name">{text.name}</label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          maxLength={100}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="phone">{text.phone}</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="(11) 99999-9999"
          required
        />
        <small>{text.phoneHint}</small>
      </div>
      <div className="field field--wide">
        <label htmlFor="reason">{text.reason}</label>
        <select id="reason" name="reason" defaultValue="" required>
          <option value="" disabled>
            {text.select}
          </option>
          {reasons.map((reason) => (
            <option key={reason}>{reason}</option>
          ))}
        </select>
      </div>
      <div className="field field--wide">
        <label htmlFor="message">
          {text.message} <span>{text.optional}</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={1000}
          placeholder={text.placeholder}
        />
      </div>
      {mode === "scheduled" && (
        <fieldset className="schedule-fields field--wide">
          <legend>{text.when}</legend>
          <p>{text.timezone}</p>
          <div>
            <label>
              {text.date}
              <input name="scheduledDate" type="date" required />
            </label>
            <label>
              {text.time}
              <input name="scheduledTime" type="time" required />
            </label>
            <label>
              {text.timeZone}
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
                    {timezoneLabels[locale][index]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>
      )}
      <label className="consent field--wide">
        <input name="consent" type="checkbox" required />
        <span>{text.consent}</span>
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
          ? text.submitting
          : mode === "now"
            ? text.submitNow
            : text.submitScheduled}
      </button>
    </form>
  );
}
