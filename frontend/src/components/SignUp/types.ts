export interface Signup {
    title: string;
    desc: string;
    nameTitle: string;
    namePlaceholder: string;
    emailTitle: string;
    emailPlaceholder: string;
    passwordTitle: string;
    passwordPlaceholder: string;
    signup: string;
    link: string;
    redirecting: string;
}

export interface SignupFormData {
    email: string;
    password: string;
    name: string;
}
