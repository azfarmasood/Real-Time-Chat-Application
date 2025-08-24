declare const addUser: ({ id, name, room }: {
    id: string;
    name: string;
    room: string;
}) => {
    error: string;
    user?: never;
} | {
    user: {
        id: string;
        name: string;
        room: string;
    };
    error?: never;
};
declare const removeUser: (id: string) => {
    id: string;
    name: string;
    room: string;
} | undefined;
declare const getUser: (id: string) => {
    id: string;
    name: string;
    room: string;
} | undefined;
declare const getUsersInRoom: (room: string) => {
    id: string;
    name: string;
    room: string;
}[];
export { addUser, removeUser, getUser, getUsersInRoom };
//# sourceMappingURL=user.d.ts.map