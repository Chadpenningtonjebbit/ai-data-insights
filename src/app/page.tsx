"use client";

import { JebbieChat, useJebbieChat } from "@/components/jebbie/chat-drawer";
import { DataSourceSelector } from "@/components/data-source-selector";
import { DebugCSV } from "@/components/debug-csv";
import { TopNav } from "@/components/top-nav";

export default function Home() {
  const { openChat, JebbieChat: JebbieChatWithProps } = useJebbieChat();

  return (
    <main className="flex min-h-screen flex-col">
      <TopNav openChat={openChat} />
      <div className="flex flex-col items-center p-8 bg-gray-50 flex-1">
        <div className="w-full max-w-[650px]">
          <DataSourceSelector />
        </div>
      </div>
      
      <JebbieChatWithProps />
      <DebugCSV />
    </main>
  );
}
