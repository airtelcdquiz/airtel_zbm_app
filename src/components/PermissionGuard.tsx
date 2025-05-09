import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission, UserPermissions } from '@/types/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermissions: Permission[];
  userPermissions: UserPermissions | null;
  fallback?: ReactNode;
  requireAll?: boolean;
}

export const PermissionGuard = ({
  children,
  requiredPermissions,
  userPermissions,
  fallback = null,
  requireAll = false,
}: PermissionGuardProps) => {
  const { hasAllPermissions, hasAnyPermission } = usePermissions(userPermissions);

  const hasAccess = requireAll
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}; 