import {
    LucideIcon,
    MailIcon,
    MessageCircleIcon,
    PhoneCallIcon,
} from "lucide-react";
import { Card } from "./types";

export const CARDCONTACT: Card[] = [
    {
        id: 1,
        title: "contactCard.call.title",
        icon: PhoneCallIcon,
        desc: "+905372825347",
        button: "contactCard.call.button",
        link: "tel:+905372825347",
    },
    {
        id: 2,
        title: "contactCard.chat.title",
        icon: MessageCircleIcon,
        desc: "contactCard.chat.desc",
        button: "contactCard.chat.button",
        link: "https://api.whatsapp.com/send/?phone=905372825347",
    },
    {
        id: 3,
        title: "contactCard.question.title",
        icon: MailIcon,
        desc: "contactCard.question.desc",
        button: "contactCard.question.button",
        link: "/contact",
    },
];
