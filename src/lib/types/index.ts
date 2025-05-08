

export interface User {
    id: number
    participant_phone: string
    participant_full_name: string
    participant_category: string
    participant_class: string
    participant_function: string
    school_id: string
    class_id: string
    code_school: string
}

export interface AuthSession {
    token: string
    create_at: string
    expire_at: string
}