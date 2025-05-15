

export interface User {
    id: number
    participant_phone: string
    participant_full_name: string
    participant_category: string
    participant_class: string
    participant_function: string
    school_id: number
    class_id: number
    code_school: string
}

export interface AuthSession {
    token: string
    create_at: string
    expire_at: string
}


export interface CookieResponse {
    name: string
    value: any
}
export interface CookieProvider {
    get(name: string): CookieResponse | undefined;
    set(name: string, value: any, exdays?: number): void;
    remove(name: string): void; 
    removeAll: ()=> void
}

export interface School {
    id: number
    idcode: number
    schoolname: string
}

export interface Permission {
    id: number
    name: string
    description: string
}

export interface Role {
    id: number
    name: string
    permissions: Permission[]
}

export interface Permissions { 
    direct_permissions: string[],
    is_superuser: boolean,
    roles: Role[]
}