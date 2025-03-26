export type Message = {
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
  isFollowUp?: boolean; // Flag to identify follow-up messages
  detailedFeedback?: string; // Store detailed feedback when a user gives a thumbs down
}; 