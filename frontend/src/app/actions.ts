// src/app/actions.ts
"use server";

import { Resend } from "resend";
import { contactFormSchema, ContactFormValues } from "@/src/lib/schemas";

const resend = new Resend(process.env.RESEND_API_KEY);

// CHANGED: Accepted argument is now the typed object, not FormData
export async function sendContactEmail(data: ContactFormValues) {
	// 1. Validate on the server (Double check security)
	const result = contactFormSchema.safeParse(data);

	if (!result.success) {
		return { error: "Invalid data provided" };
	}

	const { fullName, email, message } = result.data;

	try {
		const { data: emailData, error } = await resend.emails.send({
			from: "Contact Form <onboarding@resend.dev>",
			to: ["parsamanes@yahoo.com"],
			replyTo: email,
			subject: `New message from ${fullName}`,
			text: `Name: ${fullName}\nEmail: ${email}\n\nMessage:\n${message}`,
		});

		if (error) {
			return { error: error.message };
		}

		return { success: true, data: emailData };
	} catch (error) {
		return { error: "Failed to send email" };
	}
}
