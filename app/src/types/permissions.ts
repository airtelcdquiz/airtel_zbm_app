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


export interface Classement {
  name: string;
  phone_number: string;
  points: number;
  code: string;
  schoolname: string;
}

export interface Document {
    created_at: string;
    description: string;
    file_size: number;
    id: number;
    mime_type: string;
    name: string;
    updated_at: string;
    uploaded_by: number;
}