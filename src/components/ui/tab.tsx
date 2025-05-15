'use client'

import React from 'react' 

interface TabProps {
    onTabChange: (tab: string) => any;
    tabs: {
        name: string;
        component: React.ReactNode;
    }[]
}

export default function Tab(props: TabProps) {
    const [activeTab, setActiveTab] = React.useState(props.tabs[0]);
    return <>
        <div className="flex flex-row w-full items-center">
        {
            props.tabs.map((tab) => (
                <div key={tab.name} className={`cursor-pointer text-[13px] border-b-[2px] border-red-0 duration-300 ${activeTab.name === tab.name ? "border-red-500" : ""}`} onClick={() => setActiveTab(tab)}> 
                    <p className={`${activeTab.name === tab.name ? "text-red-500" : ""} px-[20px] text-bold`}>{tab.name}</p> 
                </div>
            ))
        }
    </div>
    {activeTab.component}
    </>
}