'use client' 
import api from "@/lib/api";
import cookies from "@/lib/cookies";
import { Permissions, Role, School, User, Permission } from "@/lib/types";  
import React from "react";

interface UserDetailsPageProps {
    user: User,
    school: School,
    permissions: string[],
    roles: string[],
    all_permissions: Permission[],
    all_roles: Role[],
    user_permissions: Permissions
}

export default function UserDetailsPage(props: UserDetailsPageProps){
    // Store props in state for reactivity
    const [activeTab, setActiveTab] = React.useState<string>("general");
    const [user, setUser] = React.useState<User>(props.user);
    const [roles, setRoles] = React.useState<string[]>(props.roles);
    const [permissions, setPermissions] = React.useState<string[]>(props.permissions);
    const [userPermissions, setUserPermissions] = React.useState<Permissions>(props.user_permissions);

    // Loading states
    const [superuserLoading, setSuperuserLoading] = React.useState(false);
    const [roleLoading, setRoleLoading] = React.useState<{ [roleId: string]: boolean }>({});
    const [permissionLoading, setPermissionLoading] = React.useState<{ [permissionId: string]: boolean }>({});
    const [activationLoading, setActivationLoading] = React.useState(false);

    const handleActivationToggle = async () => {
        setActivationLoading(true);
        try {
            const endpoint = user.is_active ? 'deactivate' : 'activate';
            const response = await api(cookies).post(`/users/${user.phone_number}/${endpoint}`);
            setUser(response.data.user);
        } catch (error) {
            console.error('Erreur lors de la modification du statut:', error);
        } finally {
            setActivationLoading(false);
        }
    };

    // all_roles, all_permissions, school are static, so we can use props directly

    return <div className="w-full h-full">
        <div className="bg-white rounded p-[20px] mt-[20px]">
            <div className="flex flex-row w-full items-center">
                <div className={`cursor-pointer text-[13px] border-b-[2px] border-red-0 duration-300 ${activeTab === "general" ? "border-red-500" : ""}`} onClick={() => setActiveTab("general")}> 
                    <p className={`${activeTab === "general" ? "text-red-500" : ""} px-[20px] text-bold`}>Informations Générales</p> 
                </div>
                <div className={`cursor-pointer text-[13px] border-b-[2px] border-red-0 duration-300 ${activeTab === "roles" ? "border-red-500" : ""}`} onClick={() => setActiveTab("roles")}> 
                    <p className={`${activeTab === "roles" ? "text-red-500" : ""}  px-[20px] text-bold`}>Rôles & Permissions</p> 
                </div>
            </div>
            <div className="mt-[20px]">
                {activeTab === "general" && (
                    <div>
                        <p>Nom Complet : {user.name}</p>
                        <p>Téléphone : {user.phone_number}</p> 
                        <p>Ecole : {props.school.code}</p>
                        <div className="mt-4">
                            <button
                                onClick={handleActivationToggle}
                                disabled={activationLoading}
                                className={`px-4 py-2 rounded ${
                                    user.is_active 
                                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
                            >
                                {activationLoading ? 'Chargement...' : 
                                    user.is_active ? 'Désactiver le compte' : 'Activer le compte'
                                }
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "roles" && (
                    <div>
                        <div>
                            <h1>User is superuser : {
                                superuserLoading ? (
                                    <span>Loading...</span>
                                ) : (
                                    <input type="checkbox" checked={userPermissions.is_superuser} onChange={() => {
                                        const exec = async () => {
                                            setSuperuserLoading(true);
                                            try {
                                                if(userPermissions.is_superuser) {
                                                    await api(cookies).post(`/users/${user.phone_number}/unset_superuser`);
                                                    setUserPermissions(prev => ({ ...prev, is_superuser: false }));
                                                } else {
                                                    await api(cookies).post(`/users/${user.phone_number}/set_superuser`); 
                                                    setUserPermissions(prev => ({ ...prev, is_superuser: true }));
                                                }
                                            } finally {
                                                setSuperuserLoading(false);
                                            }
                                        }
                                        exec()
                                    }} />
                                )
                            }</h1>

                        </div>
                        <h1>Rôles</h1>
                        <div className="">
                            {props.all_roles.map(role => (
                                <div key={role.id} className="flex flex-row items-center gap-[10px]">
                                    {roleLoading[role.id] ? (
                                        <span>Loading...</span>
                                    ) : (
                                        <input type="checkbox" checked={roles.includes(role.name)} onChange={() => {
                                            if(roles.includes(role.name)){
                                                const exec = async () => {
                                                    setRoleLoading(prev => ({ ...prev, [role.id]: true }));
                                                    try {
                                                        await api(cookies).delete(`/users/${user.phone_number}/roles/${role.id}`);
                                                        setRoles(prev => prev.filter(r => r !== role.name));
                                                    } finally {
                                                        setRoleLoading(prev => ({ ...prev, [role.id]: false }));
                                                    }
                                                }
                                                exec()
                                            }else{
                                                const exec = async () => {
                                                    setRoleLoading(prev => ({ ...prev, [role.id]: true }));
                                                    try {
                                                        await api(cookies).post(`/users/${user.phone_number}/roles/${role.id}`);
                                                        setRoles(prev => [...prev, role.name]);
                                                    } finally {
                                                        setRoleLoading(prev => ({ ...prev, [role.id]: false }));
                                                    }
                                                }
                                                exec()
                                            }
                                        }} />
                                    )}
                                    <p>{role.name}</p>
                                </div>
                            ))}
                        </div>
                        <hr/>
                        <h1>Permissions</h1>
                        <div className="">
                            {props.all_permissions.map(permission => (
                                <div key={permission.id} className="flex flex-row items-center gap-[10px]">
                                    {permissionLoading[permission.id] ? (
                                        <span>Loading...</span>
                                    ) : (
                                        <input type="checkbox" checked={permissions.includes(permission.name)} onChange={() => {
                                            if(permissions.includes(permission.name)){
                                                const exec = async () => {
                                                    setPermissionLoading(prev => ({ ...prev, [permission.id]: true }));
                                                    try {
                                                        await api(cookies).delete(`/users/${user.phone_number}/permissions/${permission.id}`);
                                                        setPermissions(prev => prev.filter(p => p !== permission.name));
                                                    } finally {
                                                        setPermissionLoading(prev => ({ ...prev, [permission.id]: false }));
                                                    }
                                                }
                                                exec()
                                            }else{
                                                const exec = async () => {
                                                    setPermissionLoading(prev => ({ ...prev, [permission.id]: true }));
                                                    try {
                                                        await api(cookies).post(`/users/${user.phone_number}/permissions/${permission.id}`, {
                                                            permission_id: permission.id
                                                        });
                                                        setPermissions(prev => [...prev, permission.name]);
                                                    } finally {
                                                        setPermissionLoading(prev => ({ ...prev, [permission.id]: false }));
                                                    }
                                                }
                                                exec()
                                            }
                                        }} />
                                    )}
                                    <p>{permission.name}</p>
                                </div>
                            ))}
                        </div>

                        {/* <p>Rôles : {roles.map(role => props.all_roles.find(r => r.name === role)?.name).join(", ")}</p>
                        <p>Permissions : {permissions.map(permission => props.all_permissions.find(p => p.name === permission)?.name).join(", ")}</p> */}
                    </div>
                )}

            </div>
            
        </div>
    </div>
}