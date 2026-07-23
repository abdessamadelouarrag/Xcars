import "server-only";

import nodemailer from "nodemailer";
import { Resend } from "resend";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export type EmailDeliveryResult = {
  id: string | null;
  delivered: boolean;
  transport: "smtp" | "resend" | "development";
};

export function getEmailTransportStatus() {
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);

  return {
    configured: smtpConfigured || resendConfigured,
    transport: smtpConfigured
      ? ("smtp" as const)
      : resendConfigured
        ? ("resend" as const)
        : ("development" as const),
  };
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<EmailDeliveryResult> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpHost && smtpUser && smtpPass) {
    const port = Number(process.env.SMTP_PORT ?? "587");
    const secure =
      process.env.SMTP_SECURE === "true" || port === 465;
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure,
        auth: { user: smtpUser, pass: smtpPass.replaceAll(" ", "") },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      });
      const result = await transporter.sendMail({
        from: process.env.EMAIL_FROM ?? `XCars <${smtpUser}>`,
        disableFileAccess: true,
        disableUrlAccess: true,
        ...input,
      });
      return {
        id: result.messageId,
        delivered: Boolean(result.accepted.length),
        transport: "smtp",
      };
    } catch (error) {
      console.error(
        "SMTP delivery failed:",
        error instanceof Error ? error.message : error,
      );
      return { id: null, delivered: false, transport: "smtp" };
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "test") {
      console.info(`[email:development] ${input.subject} -> ${input.to}`);
    }
    return {
      id: "development-email",
      delivered: false,
      transport: "development",
    };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "XCars <no-reply@example.com>",
    ...input,
  });

  if (error) {
    console.error(`Email delivery failed: ${error.message}`);
    return { id: null, delivered: false, transport: "resend" };
  }

  return {
    id: data?.id ?? null,
    delivered: Boolean(data?.id),
    transport: "resend",
  };
}
