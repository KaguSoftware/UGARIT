import { footerTypes, socialLink } from "./types";

export const FOOTER_DATA: footerTypes = [
    {
        titleKey: "footer.first.title",
        links: [
            { label: "footer.first.one", href: "/first" },
            { label: "footer.first.two", href: "/second" },
            { label: "footer.first.three", href: "/third" }
        ],
    },
    {
        titleKey: "footer.second.title",
        links: [
            { label: "footer.second.one", href: "/first" },
            { label: "footer.second.two", href: "/second" },
            { label: "footer.second.three", href: "/third" },
            { label: "footer.second.four", href: "/fourth" },
            { label: "footer.second.five", href: "/fifth" },
        ],
    },
    {
        titleKey: "footer.third.title",
        links: [
            { label: "footer.third.one", href: "/first" },
            { label: "footer.third.two", href: "/second" },
            { label: "footer.third.three", href: "/thvird" },
            { label: "footer.third.four", href: "/thifrd" },
        ],
    }
];

export const SOCIAL_LINKS: socialLink[] = [
    {
        label: "footer.icon.one",
        href: "footer.icon.oneLink",
        icon: "footer.icon.onePath"
    },
    {
        label: "footer.icon.two",
        href: "footer.icon.twoLink",
        icon: "footer.icon.twoPath"
    },
    {
        label: "footer.icon.four",
        href: "footer.icon.fourLink",
        icon: "footer.icon.fourPath"
    },

];