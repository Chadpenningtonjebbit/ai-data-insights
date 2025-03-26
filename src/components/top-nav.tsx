"use client";

import React from 'react';
import { Button } from '@/components/ui/button';

export function TopNav({ openChat }: { openChat: () => void }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6 w-full">
        <div className="font-semibold flex items-center">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="mr-3"
          >
            <path d="M4.69233 9.38466C7.28383 9.38466 9.38466 7.28383 9.38466 4.69233C9.38466 2.10083 7.28383 0 4.69233 0C2.10083 0 0 2.10083 0 4.69233C0 7.28383 2.10083 9.38466 4.69233 9.38466Z" fill="#2563eb"/>
            <path d="M15.3076 9.38466C17.8991 9.38466 19.9999 7.28383 19.9999 4.69233C19.9999 2.10083 17.8991 0 15.3076 0C12.7161 0 10.6152 2.10083 10.6152 4.69233C10.6152 7.28383 12.7161 9.38466 15.3076 9.38466Z" fill="#2563eb"/>
            <path d="M15.3076 19.9999C17.8991 19.9999 19.9999 17.8991 19.9999 15.3076C19.9999 12.7161 17.8991 10.6152 15.3076 10.6152C12.7161 10.6152 10.6152 12.7161 10.6152 15.3076C10.6152 17.8991 12.7161 19.9999 15.3076 19.9999Z" fill="#2563eb"/>
          </svg>
          <span>Jebbit Insights</span>
        </div>
        
        <Button 
          onClick={openChat}
          className="text-white bg-blue-600 hover:bg-blue-700 h-[36px] px-[16px]"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 18 18" 
            fill="currentColor"
            className="mr-2"
          >
            <path d="M8.08927 16.9917C8.4442 17.7744 9.5558 17.7744 9.91073 16.9917L11.9647 12.4624C12.0648 12.2417 12.2417 12.0648 12.4624 11.9647L16.9917 9.91073C17.7744 9.5558 17.7744 8.4442 16.9917 8.08927L12.4624 6.03529C12.2417 5.93519 12.0648 5.75831 11.9647 5.53757L9.91073 1.00828C9.5558 0.225616 8.4442 0.225614 8.08927 1.00827L6.03529 5.53757C5.93518 5.75831 5.75831 5.93519 5.53757 6.03529L1.00827 8.08927C0.225612 8.4442 0.225614 9.5558 1.00827 9.91073L5.53757 11.9647C5.75831 12.0648 5.93519 12.2417 6.03529 12.4624L8.08927 16.9917Z" />
          </svg>
          Ask Jebbit AI
        </Button>
      </div>
    </header>
  );
} 