export interface User { 
    phone_number: string
    name: string
    school_level: number
    school_class: number
    school_option: number
    code: number 
    is_active: boolean
    is_superuser: boolean
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
    code: string
    name: string
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