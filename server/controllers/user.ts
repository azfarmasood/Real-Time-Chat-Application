const users: {id: string, name: string, room: string}[] = [];

const addUser = ({ id, name, room }: {id: string, name: string, room: string}) => {
    name = name.trim().toLowerCase();
    room = room.trim().toLowerCase();
    const userIsAlreadyExsist = users.find((user) => user.room === room && user.name === name);

    if (userIsAlreadyExsist) {
        return { error: 'Username is already taken' };
    }

    const user = {id, name, room};

    users.push(user);

    return { user };
}

const removeUser = (id: string) => {
    const index = users.findIndex((user) => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

const getUser = (id: string) => {
    return users.find((user) => user.id === id);
}

const getUsersInRoom = (room: string) => {
    return users.filter((user) => user.room === room);
}

export { addUser, removeUser, getUser, getUsersInRoom };