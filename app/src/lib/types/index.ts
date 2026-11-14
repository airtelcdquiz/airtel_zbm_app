export interface User { 
    phone_number: string
    name: string
    school_level: number
    school_class: number
    school_option: number
    code: number 
    school_code: number
    is_active: boolean
    is_superuser: boolean
    level_label?: string
    class_label?: string
    option_label?: string
    created_at?: string | null
    is_subscribed?: boolean
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
export interface Player {
    phone_number: string
    name: string
    school_code: string | null
    school_name: string | null
    school_level: number | null
    school_class: number | null
    school_option: number | null
    level_label: string
    class_label: string
    option_label: string
    is_subscribed: boolean
    is_active: boolean
    created_at: string | null
    questions_received: number
    answers: number
    correct_answers: number
    points: number
}

export interface Admin {
    phone_number: string
    name: string
    school_code: string | null
    school_name: string | null
    is_superuser: boolean
    type: string
    roles: string[]
    attached_schools: string[]
    is_active: boolean
    created_at: string | null
}
