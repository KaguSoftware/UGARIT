
export interface footerSection {

    titleKey: string; //title of the each column
    links: footerLinks[];

}
export interface footerLinks {

    label: string; //label of the links under each title 
    href: string;  //link of the each label 

}

export type footerTypes = footerSection[];