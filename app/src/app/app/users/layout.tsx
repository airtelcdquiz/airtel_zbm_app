
import AllowedLayout from "@/components/layouts/AllowedLayout" 

export default async function Layout({children}: {children: React.ReactNode}){
    return <AllowedLayout is_superuser={true} roles={['admin']} direct_permissions={['show_users']}>
        {children}
    </AllowedLayout>
}