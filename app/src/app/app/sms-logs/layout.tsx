import AllowedLayout from "@/components/layouts/AllowedLayout"

// Logs SMS : réservé à l'administrateur global (l'API l'exige aussi).
export default async function Layout({ children }: { children: React.ReactNode }) {
    return <AllowedLayout is_superuser={true} roles={[]} direct_permissions={[]}>
        {children}
    </AllowedLayout>
}
