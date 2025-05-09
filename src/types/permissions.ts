export type Permission = 
  | 'read:users'
  | 'write:users'
  | 'delete:users'
  | 'read:quizzes'
  | 'write:quizzes'
  | 'delete:quizzes'
  | 'read:questions'
  | 'write:questions'
  | 'delete:questions'
  | 'read:reports'
  | 'write:reports'
  | 'admin';

export type Role = {
  name: string;
  permissions: Permission[];
};

export type UserPermissions = {
  roles: Role[];
  permissions: Permission[];
}; 