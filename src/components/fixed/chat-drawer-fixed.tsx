"use client";

import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCSVData } from '@/contexts/csv-context';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

// Message type definition
type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "table" | "csv";
  tableData?: Record<string, string>[];
  tableHeaders?: string[];
  isTyping?: boolean;
  displayedContent?: string;
  id?: string; // Add an ID field to track specific messages
  visibleTableRows?: number; // Track how many table rows are currently visible
  feedback?: "like" | "dislike" | null; // Track user feedback on responses
  followUpSuggestions?: string[]; // Add follow-up suggestions
  followUpSuggestionsShown?: boolean; // Track if follow-up suggestions have been shown for a table
}; 