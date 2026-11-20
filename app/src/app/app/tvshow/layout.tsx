import AllowedLayout from "@/components/layouts/AllowedLayout"

// TV Show : réservé à l'administrateur global (le service tvshow l'exige aussi).
export default async function Layout({children}: {children: React.ReactNode}){
    return <AllowedLayout is_superuser={true} roles={[]} direct_permissions={[]}>
        {children}
    </AllowedLayout>
}
