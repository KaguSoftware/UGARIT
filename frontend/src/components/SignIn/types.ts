export interface Signin {
    title: string;
    desc: string;
    emailTitle: string;
    emailPlaceholder: string;
    passwordTitle: string;
    passwordPlaceholder: string;
    signin: string;
    link: string;
    redirecting: string;
}

export interface SigninFormData {
    email: string;
    password: string;
}
