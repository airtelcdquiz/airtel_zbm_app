import AuthSessionWrapper from "@/components/auth/AuthSession";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ClientProviders from "@/components/layouts/ClientProviders";


export default function AppLayout(props: any){
    return (
        <ClientProviders>
            <AuthSessionWrapper>
                <DashboardLayout>
                    {props.children}
                </DashboardLayout>
            </AuthSessionWrapper>
        </ClientProviders>
    )
}