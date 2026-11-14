import AllowedLayout from "@/components/layouts/AllowedLayout"

// Réservé à l'administrateur global.
export default async function Layout({children}: {children: React.ReactNode}){
    return <AllowedLayout is_superuser={true} roles={[]} direct_permissions={[]}>
        {children}
    </AllowedLayout>
}
