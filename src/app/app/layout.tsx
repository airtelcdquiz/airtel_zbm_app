import AuthSessionWrapper from "@/components/auth/AuthSession";
import DashboardLayout from "@/components/layouts/DashboardLayout";


export default function AppLayout(props: any){
    return (
        <AuthSessionWrapper>
            <DashboardLayout>
                {props.children}
            </DashboardLayout>
        </AuthSessionWrapper>
    )
}