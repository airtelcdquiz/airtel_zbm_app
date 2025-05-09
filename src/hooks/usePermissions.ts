import { useCallback } from 'react';
import { Permission, UserPermissions } from '@/types/permissions';

export const usePermissions = (userPermissions: UserPermissions | null) => {
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!userPermissions) return false;
      
      // Vérifier si l'utilisateur a la permission directement
      if (userPermissions.permissions.includes(permission)) return true;
      
      // Vérifier si l'utilisateur a la permission via ses rôles
      return userPermissions.roles.some((role) =>
        role.permissions.includes(permission)
      );
    },
    [userPermissions]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.some((permission) => hasPermission(permission));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.every((permission) => hasPermission(permission));
    },
    [hasPermission]
  );

  const isAdmin = useCallback((): boolean => {
    return hasPermission('admin');
  }, [hasPermission]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
  };
}; 