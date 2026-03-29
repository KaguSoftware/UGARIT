import { LucideIcon, MailIcon, MessageCircleIcon, PhoneCallIcon } from "lucide-react";
import { Card } from "./types";

export const CARDCONTACT: Card[] = [
    {
        id: 1,
        title: "Call Us",
        icon: PhoneCallIcon,
        desc: "+905123456789",
        button: "call",
        link: ""
    },
    {
        id: 2,
        title: "Chat Us",
        icon: MessageCircleIcon,
        desc: "Send a message on WhatsApp",
        button: "send a message",
        link: ""
    },
    {
        id: 3,
        title: "Ask a Question",
        icon: MailIcon,
        desc: "Fill out our form and we'll get back to you",
        button: "fill in the form",
        link: ""
    }
]