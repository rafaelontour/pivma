export type UserPublic = {
  id: string;
  username: string;
  email: string;
};

export type CurrentUser = UserPublic & {
  permissions: string[];
  roles: string[];
};

export type CreateUserInput = Omit<UserPublic, "id"> & {
  password: string;
};

export type UserListItem = UserPublic & {
  active: boolean;
};

export type UserPosition = {
  profileId: string;
  name: string;
  description: string;
};

export type UserListItemWithPositions = UserListItem & {
  positions: UserPosition[];
};

export type UserList = {
  offset: number;
  limit: number;
  items: UserListItem[];
};

export type UserListWithPositions = Omit<UserList, "items"> & {
  items: UserListItemWithPositions[];
};
