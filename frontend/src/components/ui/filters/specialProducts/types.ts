// sp=special products

export type spIdItem = {
    id: string;
};


export type spGroup = {
    ids: spIdItem[];
};

export type spTypes = spGroup[];