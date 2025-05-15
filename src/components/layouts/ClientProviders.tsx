'use client'

import { store } from "@/lib/store";
import { Provider } from "react-redux";
import { HeroUIProvider } from "@heroui/react";

export default function ClientProviders(props:any){
    return (
        <HeroUIProvider>
        <Provider store={store}>
            {props.children}
        </Provider>
        </HeroUIProvider>
    )
}