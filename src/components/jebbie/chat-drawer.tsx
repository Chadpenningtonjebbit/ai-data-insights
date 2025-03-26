"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataSource } from "@/hooks/use-data-source";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Send, X } from "lucide-react";
import { Message } from "@/types";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Message type definition
// type Message = {
//   role: "user" | "assistant";
//   content: string;
//   timestamp: Date;
//   type?: "text" | "table" | "csv";
//   tableData?: Record<string, string>[];
//   tableHeaders?: string[];
//   isTyping?: boolean;
//   displayedContent?: string;
//   id?: string; // Add an ID field to track specific messages
//   visibleTableRows?: number; // Track how many table rows are currently visible
//   feedback?: "like" | "dislike" | null; // Track user feedback on responses
//   followUpSuggestions?: string[]; // Add follow-up suggestions
//   followUpSuggestionsShown?: boolean; // Track if follow-up suggestions have been shown for a table
// };

// Update the component declaration to accept props
type JebbieChatProps = {
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
};

export function JebbieChat({ isOpen: propIsOpen, setIsOpen: propSetIsOpen }: JebbieChatProps = {}) {
  // Use props if provided, otherwise use internal state
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const setIsOpen = propSetIsOpen || setInternalIsOpen;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [panelWidth, setPanelWidth] = useState(540); // Default width
  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const [isResizing, setIsResizing] = useState(false); // Track resizing state for UI
  const [showWelcome, setShowWelcome] = useState(true); // State to control welcome screen visibility
  const typingSpeedRef = useRef(30); // ms per character
  const pendingTableRef = useRef<{tableData: Record<string, string>[], tableHeaders: string[]} | null>(null);
  const [showBanner, setShowBanner] = useState(true); // State to control banner visibility
  const { currentData, dataSourceType, selectedBrand } = useDataSource();
  const [showBackButton, setShowBackButton] = useState(false);
  const [showFormattingExamples, setShowFormattingExamples] = useState(false);
  const [pendingTable, setPendingTable] = useState(false);

  // Added state for feedback
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [detailedFeedback, setDetailedFeedback] = useState("");
  const [currentFeedbackMessageIndex, setCurrentFeedbackMessageIndex] = useState<number | null>(null);

  // Sample popular prompts
  const popularPrompts = [
    "What are the key insights from my data?",
    "Show me a summary of the main metrics",
    "Compare the top values in my dataset",
    "What trends can you identify in my data?",
    "Find any outliers or unusual patterns"
  ];

  // Sample formatting example message
  const formattingExampleMessage = `# Heading Level 1
## Heading Level 2

This is a regular paragraph with **bold text** and *italic text*.

Here's a list of formatting options:
• Bullet point item 1
• Bullet point item 2
- Alternative bullet point style
* Another bullet style

You can also have empty lines between paragraphs.

This is how tables will be displayed when data is analyzed.`;

  // Sample table data for the example
  const sampleTableHeaders = ["Product", "Sales", "Growth", "Status"];
  const sampleTableData = [
    { "Product": "Widget A", "Sales": "$45,200", "Growth": "+12.5%", "Status": "Active" },
    { "Product": "Widget B", "Sales": "$32,100", "Growth": "+8.3%", "Status": "Active" },
    { "Product": "Widget C", "Sales": "$15,800", "Growth": "-2.1%", "Status": "Inactive" }
  ];

  // Function to show formatting example
  const showFormattingExample = () => {
    setShowWelcome(false);
    setMessages([
      {
        role: "assistant",
        content: formattingExampleMessage,
        timestamp: new Date(),
        type: "text",
        isTyping: true,
        displayedContent: ''
      }
    ]);
    
    // We'll add the table example after the text example is fully typed out
    // This is handled by the useEffect that watches for typing completion
  };

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use scrollIntoView with a specific behavior to prevent page shifting
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth", 
        block: "end" 
      });
    }
  }, [messages]);

  // Typing animation effect
  useEffect(() => {
    // Check for messages that are still typing
    const typingMessage = messages.find(m => m.isTyping);
    
    if (typingMessage) {
      // If we have a message that's still typing, animate it
      const fullContent = typingMessage.content;
      const currentContent = typingMessage.displayedContent || '';
      
      if (currentContent.length < fullContent.length) {
        // Continue typing animation
        const timeout = setTimeout(() => {
          // Determine how much text to add in this step
          let nextChunkSize = Math.floor(Math.random() * 5) + 1; // Random chunk size between 1-5 characters
          
          // Try to complete words or sentences for more natural typing
          if (Math.random() > 0.7) { // 30% chance to type a larger chunk
            // Find the next space, period, comma, or newline to type up to
            const nextSpace = fullContent.indexOf(' ', currentContent.length + nextChunkSize);
            const nextPeriod = fullContent.indexOf('.', currentContent.length + nextChunkSize);
            const nextComma = fullContent.indexOf(',', currentContent.length + nextChunkSize);
            const nextNewline = fullContent.indexOf('\n', currentContent.length + nextChunkSize);
            
            // Find the closest punctuation mark
            const punctuationMarks = [nextSpace, nextPeriod, nextComma, nextNewline]
              .filter(pos => pos !== -1)
              .sort((a, b) => a - b);
            
            if (punctuationMarks.length > 0 && punctuationMarks[0] < currentContent.length + 20) {
              // Type up to the next punctuation mark (but limit to 20 chars to avoid huge jumps)
              nextChunkSize = punctuationMarks[0] - currentContent.length + 1;
            } else if (Math.random() > 0.5) { // 50% chance for a paragraph jump
              // Occasionally type a whole paragraph at once
              const paragraphEnd = fullContent.indexOf('\n\n', currentContent.length);
              if (paragraphEnd !== -1 && paragraphEnd < currentContent.length + 100) {
                nextChunkSize = paragraphEnd - currentContent.length + 2;
              }
            }
          }
          
          // Make sure we don't go beyond the full content length
          nextChunkSize = Math.min(nextChunkSize, fullContent.length - currentContent.length);
          
          // Add the next chunk of text
          const newDisplayedContent = currentContent + fullContent.substring(currentContent.length, currentContent.length + nextChunkSize);
          
          setMessages(prev => 
            prev.map(m => 
              m === typingMessage 
                ? { ...m, displayedContent: newDisplayedContent } 
                : m
            )
          );
        }, Math.floor(Math.random() * 30) + 10); // Random delay between 10-40ms for more natural typing
        
        return () => clearTimeout(timeout);
      } else {
        // Typing is complete, remove typing flag
        setMessages(prev => 
          prev.map(m => 
            m === typingMessage 
              ? { ...m, isTyping: false } 
              : m
          )
        );
        
        // Check if this was the formatting example message
        if (typingMessage.content === formattingExampleMessage) {
          // Add the table example after a short delay
          setTimeout(() => {
            setMessages(prev => [
              ...prev,
              {
                role: "assistant",
                content: "Here's an example of a data table:",
                timestamp: new Date(),
                type: "text",
                isTyping: true,
                displayedContent: ''
              }
            ]);
          }, 500);
        }
        
        // Check if this was the table introduction message
        if (typingMessage.content === "Here's an example of a data table:") {
          // Add the actual table after a short delay
          setTimeout(() => {
            setMessages(prev => [
              ...prev,
              {
                role: "assistant",
                content: "Here's the data you requested:",
                timestamp: new Date(),
                type: "table",
                tableData: sampleTableData,
                tableHeaders: sampleTableHeaders,
                visibleTableRows: 0 // Start with 0 visible rows for animation
              }
            ]);
          }, 300);
        }
        
        // Check if we have a pending table to display
        if (pendingTableRef.current) {
          const { tableData, tableHeaders } = pendingTableRef.current;
          
          // Create a new message for the table
          const tableMessage: Message = {
            role: "assistant",
            content: "Here's the data you requested:",
            timestamp: new Date(),
            type: "table",
            tableData: tableData,
            tableHeaders: tableHeaders,
            visibleTableRows: 0 // Start with 0 visible rows
          };
          
          // Add the table message after a short delay
          setTimeout(() => {
            setMessages(prev => [...prev, tableMessage]);
            // Clear the pending table
            pendingTableRef.current = null;
          }, 300);
        }
      }
    }
  }, [messages, formattingExampleMessage]);

  // Table row animation effect
  useEffect(() => {
    const tableMessage = messages.find(m => 
      m.type === "table" && 
      m.tableData && 
      m.visibleTableRows !== undefined && 
      m.visibleTableRows < m.tableData.length
    );
    
    if (tableMessage && tableMessage.tableData) {
      const timeout = setTimeout(() => {
        // Increment visible rows
        setMessages(prev => 
          prev.map(m => 
            m === tableMessage 
              ? { ...m, visibleTableRows: Math.min((m.visibleTableRows || 0) + 1, m.tableData!.length) } 
              : m
          )
        );
      }, 100); // Speed of table row animation
      
      return () => clearTimeout(timeout);
    }
    
    // Check for fully rendered tables that need follow-up suggestions
    const fullyRenderedTable = messages.find(m => 
      m.type === "table" && 
      m.tableData && 
      m.visibleTableRows === m.tableData.length &&
      !m.followUpSuggestionsShown
    );
    
    // Check for completed text messages that need follow-up suggestions
    const _completedTextMessage = messages.find(m => 
      m.role === "assistant" && 
      m.type === "text" && 
      !m.isTyping && 
      !m.followUpSuggestionsShown
    );
    
    // Helper function to check if a message contains actual data insights
    const _containsDataInsights = (content: string): boolean => {
      const contentLower = content.toLowerCase();
      
      // Check for data-related keywords and patterns
      const dataKeywords = [
        'average', 'mean', 'median', 'total', 'sum', 'percentage', 'rate',
        'increase', 'decrease', 'change', 'trend', 'pattern', 'comparison',
        'analysis', 'insight', 'finding', 'data shows', 'results indicate',
        'statistics', 'metrics', 'values', 'numbers', 'figures'
      ];
      
      // Check if content contains any of the data keywords
      const hasDataKeywords = dataKeywords.some(keyword => contentLower.includes(keyword));
      
      // Check if content has numerical data (numbers, percentages)
      const hasNumericalData = /\d+%|\d+\.\d+|\$\d+|\d+\s*(?:thousand|million|billion)/.test(content);
      
      // Check if content has structured data indicators (bullet points, headers)
      const hasStructuredData = /•|\*\*|##/.test(content);
      
      return hasDataKeywords || hasNumericalData || hasStructuredData;
    };
    
    // Handle follow-up suggestions for tables
    if (fullyRenderedTable && !fullyRenderedTable.followUpSuggestionsShown) {
      // Mark this table as having shown follow-up suggestions
      setMessages(prev => 
        prev.map(m => 
          m === fullyRenderedTable 
            ? { ...m, followUpSuggestionsShown: true }
            : m
        )
      );
      
      // Generate table-specific follow-up suggestions
      if (fullyRenderedTable.tableData && fullyRenderedTable.tableHeaders) {
        const suggestions = generateTableFollowUps(
          fullyRenderedTable.tableData, 
          fullyRenderedTable.tableHeaders
        );
        
        // Add follow-up message after a delay
        setTimeout(() => {
          const followUpContent = "Would you like to know more? For example:\n\n" +
            "• " + suggestions[0] + "\n\n" +
            "• " + suggestions[1];
          
          setMessages(prev => [
            ...prev,
            {
              role: "assistant",
              content: followUpContent,
              timestamp: new Date(),
              type: "text",
              isTyping: true,
              displayedContent: '',
              isFollowUp: true,
              followUpSuggestionsShown: true
            }
          ]);
        }, 800);
      }
    }
    
    // Remove follow-up suggestions for text messages entirely
    // The code for handling text message follow-ups has been removed
  }, [messages, sampleTableData, sampleTableHeaders]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Hide welcome screen when sending a message
    setShowWelcome(false);
    
    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // Debug log to check if data is available
      console.log("Sending message with data:", currentData ? {
        source: dataSourceType,
        brand: selectedBrand,
        headers: currentData.headers,
        rowCount: currentData.rows.length,
        fileName: currentData.fileName
      } : "No data available");
      
      // Get API key from localStorage if available
      const apiKey = localStorage.getItem("openai_api_key");
      
      // Prepare headers with API key if available
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add API key to headers if available
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }
      
      const response = await fetch('/api/jebbie', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: input,
          userId: 'user-1',
          brandId: selectedBrand || 'brand-1',
          dataSource: dataSourceType,
          csvData: currentData // Send current data regardless of source
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      const data = await response.json();
      
      // Check if the response contains table data
      if (data.message.tableData && data.message.tableHeaders) {
        // This is a table response - add it directly
        const tableMessage: Message = {
          ...data.message,
          timestamp: new Date(),
          type: "table",
          visibleTableRows: 0 // Start with 0 visible rows for animation
        };
        
        setMessages((prev) => [...prev, tableMessage]);
      } else {
        // This is a text-only response
        const aiMessage: Message = {
          ...data.message,
          timestamp: new Date(),
          type: "text",
          isTyping: true,
          displayedContent: ''
        };
        
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error processing your request. Please try again. Is there something specific you'd like me to help you with?",
          timestamp: new Date(),
          isTyping: true,
          displayedContent: ''
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate follow-up suggestions based on the content
  const _generateFollowUpSuggestions = (content: string): string[] => {
    // Content-specific follow-ups based on the actual response
    const contentSpecificSuggestions: string[] = [];
    const contentLower = content.toLowerCase();
    
    // Check for specific metrics or topics in the content
    if (contentLower.includes("average") || contentLower.includes("mean") || contentLower.includes("median")) {
      contentSpecificSuggestions.push(
        "What's causing the variation in these values?",
        "How do these averages compare to industry standards?"
      );
    }
    
    if (contentLower.includes("increase") || contentLower.includes("decrease") || contentLower.includes("change")) {
      contentSpecificSuggestions.push(
        "What factors contributed to this change?",
        "Is this change statistically significant?"
      );
    }
    
    if (contentLower.includes("comparison") || contentLower.includes("compare") || contentLower.includes("versus")) {
      contentSpecificSuggestions.push(
        "What's driving the differences between these groups?",
        "Which factors have the biggest impact on these differences?"
      );
    }
    
    if (contentLower.includes("trend") || contentLower.includes("over time") || contentLower.includes("pattern")) {
      contentSpecificSuggestions.push(
        "What's causing this trend?",
        "Is this trend likely to continue in the future?"
      );
    }
    
    if (contentLower.includes("outlier") || contentLower.includes("anomaly") || contentLower.includes("unusual")) {
      contentSpecificSuggestions.push(
        "What might explain these outliers?",
        "Should we exclude these outliers from our analysis?"
      );
    }
    
    // If we couldn't generate specific suggestions, use these defaults
    if (contentSpecificSuggestions.length === 0) {
      return [
        "Can you explain this in more detail?",
        "What actions should I take based on this information?"
      ];
    }
    
    // Return all suggestions - we'll limit them when displaying
    return contentSpecificSuggestions;
  };
  
  // Generate table-specific follow-up suggestions
  const generateTableFollowUps = (tableData: Record<string, string>[], tableHeaders: string[]): string[] => {
    const suggestions: string[] = [];
    
    // Check if tableData is valid and has at least one row
    if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
      return ["Can you explain this data?", "What insights can you provide from this data?"];
    }
    
    // Extract column names to make more specific suggestions
    const headers = Object.keys(tableData[0] || {});
    const hasTimeData = headers.some(h => 
      h.toLowerCase().includes('date') || 
      h.toLowerCase().includes('month') || 
      h.toLowerCase().includes('year') || 
      h.toLowerCase().includes('period')
    );
    
    if (hasTimeData) {
      suggestions.push(
        "How has this data changed over time?",
        "Are there any seasonal patterns in this data?"
      );
    }
    
    suggestions.push(
      "What are the most important insights from this table?",
      "Can you identify any unusual values in this data?"
    );
    
    return suggestions;
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  // Reset to welcome screen
  const handleBackToWelcome = () => {
    setShowWelcome(true);
  };

  // Copy message content to clipboard
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        // Could add a toast notification here
        console.log('Message copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy message: ', err);
      });
  };

  // Retry last user message
  const handleRetry = () => {
    // Find the last user message
    const lastUserMessageIndex = [...messages].reverse().findIndex(m => m.role === "user");
    
    if (lastUserMessageIndex !== -1) {
      const lastUserMessage = messages[messages.length - 1 - lastUserMessageIndex];
      
      // Set the input to the last user message
      setInput(lastUserMessage.content);
      
      // Remove all messages after the last user message
      setMessages(prev => prev.slice(0, messages.length - lastUserMessageIndex));
    }
  };

  // Handle feedback (like/dislike)
  const handleFeedback = async (messageIndex: number, feedback: "like" | "dislike") => {
    // If they're clicking the same feedback that's already selected, toggle it off
    if (messages[messageIndex].feedback === feedback) {
      setMessages(prev => 
        prev.map((message, index) => 
          index === messageIndex 
            ? { ...message, feedback: null } 
            : message
        )
      );
      
      // Send feedback removal to API
      try {
        await fetch('/api/jebbie/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedback: 'removed',
            messageContent: messages[messageIndex].content,
            detailedFeedback: '',
          }),
        });
      } catch (error) {
        console.error('Error sending feedback removal:', error);
      }
      
      return;
    }
    
    // Set the feedback
    setMessages(prev => 
      prev.map((message, index) => 
        index === messageIndex 
          ? { ...message, feedback } 
          : message
      )
    );
    
    // If feedback is "dislike", open the dialog for more detailed feedback
    if (feedback === "dislike") {
      setCurrentFeedbackMessageIndex(messageIndex);
      setDetailedFeedback("");
      setIsFeedbackDialogOpen(true);
    } else {
      // For "like" feedback, send to API immediately
      try {
        await fetch('/api/jebbie/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedback,
            messageContent: messages[messageIndex].content,
            detailedFeedback: '',
          }),
        });
      } catch (error) {
        console.error('Error sending feedback:', error);
      }
    }
    
    // Log the feedback
    console.log(`Message ${messageIndex} received ${feedback} feedback`);
  };

  // Handle submitting detailed feedback
  const handleSubmitDetailedFeedback = async () => {
    if (currentFeedbackMessageIndex !== null) {
      // Store the detailed feedback with the message
      setMessages(prev => 
        prev.map((message, index) => 
          index === currentFeedbackMessageIndex 
            ? { ...message, detailedFeedback } 
            : message
        )
      );
      
      // Send the feedback to the API
      try {
        await fetch('/api/jebbie/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedback: 'dislike',
            messageContent: messages[currentFeedbackMessageIndex].content,
            detailedFeedback,
          }),
        });
      } catch (error) {
        console.error('Error sending detailed feedback:', error);
      }
      
      // Close the dialog
      setIsFeedbackDialogOpen(false);
    }
  };

  // Convert table data to CSV
  const convertToCSV = (tableData: Record<string, string>[], tableHeaders: string[]) => {
    // Create header row
    let csv = tableHeaders.join(',') + '\n';
    
    // Add data rows
    tableData.forEach(row => {
      const rowValues = tableHeaders.map(header => {
        // Handle values that contain commas by wrapping in quotes
        const value = row[header] || '';
        return value.includes(',') ? `"${value}"` : value;
      });
      csv += rowValues.join(',') + '\n';
    });
    
    return csv;
  };

  // Download table as CSV
  const downloadCSV = (tableData: Record<string, string>[], tableHeaders: string[]) => {
    const csv = convertToCSV(tableData, tableHeaders);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Create filename based on current date/time
    const date = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `jebbit-data-${date}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Example of rendering a table response
  const renderTableMessage = (message: Message) => {
    if (!message.tableData || !message.tableHeaders) return null;
    
    // Determine how many rows to show based on animation state
    const visibleRows = message.visibleTableRows !== undefined 
      ? message.visibleTableRows 
      : message.tableData.length; // Show all if not animating
    
    // Generate SQL CREATE TABLE statement
    const generateSQLCreateTable = () => {
      const tableName = "sample_table";
      
      // Determine column types based on data
      const columnTypes = message.tableHeaders!.map(header => {
        const sampleValue = message.tableData![0]?.[header] || '';
        // Simple type inference
        if (!isNaN(Number(sampleValue))) return 'NUMERIC';
        if (sampleValue.match(/^\d{4}-\d{2}-\d{2}/) || sampleValue.match(/^\d{2}\/\d{2}\/\d{4}/)) return 'DATE';
        return 'VARCHAR(255)';
      });
      
      // Create the SQL statement
      const createTableSQL = `CREATE TABLE ${tableName} (\n` + 
        message.tableHeaders!.map((header, index) => {
          return `  ${header.replace(/\s+/g, '_')} ${columnTypes[index]}`;
        }).join(',\n') + 
        '\n);';
        
      return createTableSQL;
    };
    
    // Generate SQL INSERT statements
    const generateSQLInserts = () => {
      const tableName = "sample_table";
      // Remove the row limit to show all rows
      const allRows = message.tableData!.slice(0, visibleRows);
      
      return allRows.map((row, index) => {
        const columns = message.tableHeaders!.map(h => h.replace(/\s+/g, '_')).join(', ');
        const values = message.tableHeaders!.map(header => {
          const value = row[header] || '';
          // Quote strings, leave numbers as is
          return isNaN(Number(value)) ? `'${value.replace(/'/g, "''")}'` : value;
        }).join(', ');
        
        return `INSERT INTO ${tableName} (${columns})\nVALUES (${values});`;
      }).join('\n\n');
    };
    
    return (
      <div className="w-full border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
        <Tabs defaultValue="table" className="w-full flex flex-col gap-0">
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-300 dark:border-gray-600">
            <TabsList className="grid w-60 grid-cols-2">
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="sql">SQL View</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="table" className="w-full">
            <div className="w-full overflow-x-auto">
              <Table className="w-full border-collapse border-spacing-0">
                <TableHeader>
                  <TableRow className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700">
                    {message.tableHeaders.map((header, index) => (
                      <TableHead key={index} className="whitespace-nowrap font-medium text-gray-700 dark:text-gray-200 py-2 px-3 text-left border-b border-r border-gray-300 dark:border-gray-600 last:border-r-0">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {message.tableData.slice(0, visibleRows).map((row, rowIndex) => (
                    <TableRow 
                      key={rowIndex} 
                      className="border-b border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 animate-fadeIn"
                    >
                      {message.tableHeaders?.map((header, cellIndex) => (
                        <TableCell key={cellIndex} className="whitespace-nowrap text-gray-700 dark:text-gray-300 py-2 px-3 border-r last:border-r-0 border-gray-300 dark:border-gray-600">
                          {String(row[header] || '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {/* Show loading indicator if there are more rows to display */}
                  {visibleRows < message.tableData.length && (
                    <TableRow>
                      <TableCell 
                        colSpan={message.tableHeaders.length} 
                        className="text-center py-2 text-gray-500 dark:text-gray-400 border-b border-gray-300 dark:border-gray-600"
                      >
                        <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="sql" className="p-4 bg-gray-50 dark:bg-gray-900">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">CREATE TABLE Statement</h4>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto text-sm text-gray-800 dark:text-gray-200 font-mono">
                  {generateSQLCreateTable()}
                </pre>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  INSERT Statements ({visibleRows} rows)
                </h4>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto text-sm text-gray-800 dark:text-gray-200 font-mono">
                  {generateSQLInserts()}
                </pre>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                Note: This is a simplified SQL representation for testing purposes.
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Format timestamp safely
  const formatTimestamp = (timestamp: Date | string | number) => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "";
    }
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent text selection during drag
    resizingRef.current = true;
    setIsResizing(true); // Update UI state
    startXRef.current = e.clientX;
    startWidthRef.current = panelWidth;
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    // Add a class to the body to change cursor during resize
    document.body.classList.add('resizing');
  };

  // Handle resize move
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    
    // Calculate the new width based on the mouse movement
    const deltaX = e.clientX - startXRef.current;
    // For right panel, we need to subtract deltaX from the starting width
    const newWidth = Math.max(400, Math.min(800, startWidthRef.current - deltaX));
    
    console.log('Resize:', { 
      startX: startXRef.current, 
      currentX: e.clientX, 
      deltaX, 
      startWidth: startWidthRef.current, 
      newWidth 
    });
    
    setPanelWidth(newWidth);
  };

  // Handle resize end - using useCallback to memoize the function
  const handleResizeEnd = useCallback(() => {
    resizingRef.current = false;
    setIsResizing(false); // Update UI state
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    // Remove the resizing class
    document.body.classList.remove('resizing');
  }, []);

  // Log when panel width changes
  useEffect(() => {
    console.log('Panel width updated:', panelWidth);
  }, [panelWidth]);

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.classList.remove('resizing');
    };
  }, [handleResizeEnd]);

  // Format message content with proper styling
  const formatMessageContent = (content: string, isTyping: boolean = false): React.ReactNode => {
    if (!content) return null;
    
    // Remove special handling for follow-up messages in Gemini style
    // Helper function to format text with bold and italic styling
    const formatText = (text: string) => {
      // Handle bold text (**bold** or __bold__)
      let formattedText = text;
      const boldRegex = /(\*\*|__)(.*?)\1/g;
      formattedText = formattedText.replace(boldRegex, (match, wrapper, content) => {
        return `<strong>${content}</strong>`;
      });
      
      // Handle italic text (*italic* or _italic_)
      const italicRegex = /(\*|_)(.*?)\1/g;
      formattedText = formattedText.replace(italicRegex, (match, wrapper, content) => {
        return `<em>${content}</em>`;
      });
      
      return formattedText;
    };
    
    // Split the content into lines
    const lines = content.split('\n');
    
    return (
      <>
        {lines.map((line, index) => {
          // Handle headers (# Header)
          if (line.startsWith('# ')) {
            const headerContent = formatText(line.substring(2));
            return (
              <h2 key={index} className="text-xl font-semibold mb-3 mt-2 leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: headerContent }}></span>
                {isTyping && index === lines.length - 1 && (
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm cursor-blink" />
                )}
              </h2>
            );
          }
          
          // Handle subheaders (## Subheader)
          if (line.startsWith('## ')) {
            const subheaderContent = formatText(line.substring(3));
            return (
              <h3 key={index} className="text-lg font-semibold mb-2 mt-1 leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: subheaderContent }}></span>
                {isTyping && index === lines.length - 1 && (
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm cursor-blink" />
                )}
              </h3>
            );
          }
          
          // Handle bullet points (• Item or * Item or - Item)
          if (line.trim().startsWith('•') || line.trim().startsWith('*') || line.trim().startsWith('-')) {
            const bulletContent = formatText(line.trim().substring(1).trim());
            return (
              <div key={index} className="flex items-start mb-2 leading-relaxed">
                <span className="mr-2 flex-shrink-0">•</span>
                <span dangerouslySetInnerHTML={{ __html: bulletContent }} className="flex-1"></span>
                {isTyping && index === lines.length - 1 && (
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm cursor-blink" />
                )}
              </div>
            );
          }
          
          // Handle empty lines as paragraph breaks
          if (line.trim() === '') {
            return <div key={index} className="h-2"></div>;
          }
          
          // Regular paragraph
          const formattedLine = formatText(line);
          return (
            <p key={index} className="mb-2 leading-relaxed">
              <span dangerouslySetInnerHTML={{ __html: formattedLine }}></span>
              {isTyping && index === lines.length - 1 && (
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm cursor-blink" />
              )}
            </p>
          );
        })}
      </>
    );
  };

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure the panel is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Capture keyboard input and direct it to the input field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only capture if panel is open and not already typing in the input
      if (isOpen && inputRef.current && document.activeElement !== inputRef.current) {
        // Ignore if user is typing in another input or if modifier keys are pressed
        if (
          document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA' ||
          e.ctrlKey || 
          e.altKey || 
          e.metaKey
        ) {
          return;
        }
        
        // Ignore navigation keys and special keys
        const ignoredKeys = [
          'Escape', 'Tab', 'CapsLock', 'Shift', 'Control', 
          'Alt', 'Meta', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 
          'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown',
          'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
        ];
        
        if (!ignoredKeys.includes(e.key)) {
          // Focus the input and let the default behavior handle the keystroke
          inputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const openChat = () => {
    setIsOpen(true);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="right" 
          className="p-0 flex flex-col overflow-hidden" 
          style={{ width: `${panelWidth}px`, maxWidth: 'none' }}
        >
          <SheetTitle className="sr-only">Jebbie</SheetTitle>
          {/* Resize handle */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize z-50 hover:bg-blue-500/10"
            onMouseDown={handleResizeStart}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 dark:bg-gray-700" />
          </div>
          
          <div className="flex flex-col w-full h-full overflow-hidden">
            <div className="py-3 px-4 border-b bg-white dark:bg-gray-950 flex items-center justify-between">
              <div className="flex items-center h-8">
                {!showWelcome && messages.length > 0 ? (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleBackToWelcome}
                    className="mr-2 h-8 w-8 text-gray-500 hover:text-blue-600 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                    <span className="sr-only">Back</span>
                  </Button>
                ) : null}
                <div className="flex items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 18 18" 
                    fill="currentColor"
                    className="mr-3 text-blue-600 dark:text-blue-500"
                  >
                    <path d="M8.08927 16.9917C8.4442 17.7744 9.5558 17.7744 9.91073 16.9917L11.9647 12.4624C12.0648 12.2417 12.2417 12.0648 12.4624 11.9647L16.9917 9.91073C17.7744 9.5558 17.7744 8.4442 16.9917 8.08927L12.4624 6.03529C12.2417 5.93519 12.0648 5.75831 11.9647 5.53757L9.91073 1.00828C9.5558 0.225616 8.4442 0.225614 8.08927 1.00827L6.03529 5.53757C5.93518 5.75831 5.75831 5.93519 5.53757 6.03529L1.00827 8.08927C0.225612 8.4442 0.225614 9.5558 1.00827 9.91073L5.53757 11.9647C5.75831 12.0648 5.93519 12.2417 6.03529 12.4624L8.08927 16.9917Z" />
                  </svg>
                  <h2 className="text-gray-900 dark:text-gray-100 font-semibold text-base">Jebbie</h2>
                </div>
              </div>
            </div>

            {/* New banner notification */}
            {showBanner && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">This feature is currently in beta, accuracy may vary.</span>{" "}
                      <a href="https://support.example.com/jebbie" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                        Learn more
                      </a>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowBanner(false)}
                    className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 relative chat-container">
              {showWelcome ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="mb-8 flex flex-col items-center">
                    <div className="mb-2">
                      <h2 className="text-blue-600 text-3xl font-semibold mb-2">Hello, (user)</h2>
                      <p className="text-gray-600 dark:text-gray-300 text-base">How can I help you today?</p>
                    </div>
                  </div>
                  
                  <div className="w-full max-w-md">
                    <div className="grid grid-cols-1 gap-2 w-full mb-4">
                      {popularPrompts.map((prompt, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="justify-between text-left h-auto py-3 px-4 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg w-full focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                          onClick={() => handlePromptClick(prompt)}
                        >
                          <span className="flex items-center text-gray-700 dark:text-gray-300 break-words whitespace-normal text-sm font-normal">
                            {/* Add different icons based on the prompt content */}
                            {prompt.includes("key insights") && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-gray-500">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="16" x2="12" y2="12"/>
                                <line x1="12" y1="8" x2="12.01" y2="8"/>
                              </svg>
                            )}
                            {prompt.includes("summary") && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-gray-500">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <line x1="3" y1="9" x2="21" y2="9"/>
                                <line x1="9" y1="21" x2="9" y2="9"/>
                              </svg>
                            )}
                            {prompt.includes("Compare") && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-gray-500">
                                <line x1="18" y1="20" x2="18" y2="10"/>
                                <line x1="12" y1="20" x2="12" y2="4"/>
                                <line x1="6" y1="20" x2="6" y2="14"/>
                              </svg>
                            )}
                            {prompt.includes("trends") && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-gray-500">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                              </svg>
                            )}
                            {prompt.includes("outliers") && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-gray-500">
                                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                              </svg>
                            )}
                            {prompt}
                          </span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            className="text-blue-600 dark:text-blue-400 ml-2 flex-shrink-0"
                          >
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="py-6 flex flex-col min-h-0 chat-messages">
                    <div className="flex-1">
                      {messages.map((message, index) => {
                        // Check if this message should be stacked (if it's from the assistant and the previous message was also from the assistant)
                        const _isStacked = 
                          message.role === "assistant" && 
                          index > 0 && 
                          messages[index - 1].role === "assistant";
                        
                        // Check if this is the last message in a sequence (next message is from a different sender or there is no next message)
                        const isLastInSequence = 
                          index === messages.length - 1 || 
                          messages[index + 1].role !== message.role;
                        
                        return (
                          <div
                            key={index}
                            className={`w-full ${
                              // Only add bottom margin if this is the last message in a sequence
                              isLastInSequence ? "mb-4" : "mb-0"
                            } ${
                              message.role === "user" ? "" : "bg-transparent dark:bg-transparent"
                            } group`}
                          >
                            <div className={`px-10 ${
                              // Reduce padding for consecutive messages from the same sender
                              index > 0 && messages[index - 1].role === message.role
                              ? "py-1" 
                              : "py-3"
                            } max-w-4xl mx-auto`}>
                              {/* Message content */}
                              {message.role === "user" ? (
                                <div className="flex justify-end">
                                  <div className={`bg-blue-600 text-white rounded-lg px-4 py-[10px] max-w-[85%] ${
                                    // If this is not the first message in a sequence, reduce top margin and round top corners less
                                    index > 0 && messages[index - 1].role === "user" 
                                      ? "mt-1 rounded-t-md" 
                                      : "mt-0"
                                  } ${
                                    // If this is not the last message in a sequence, round bottom corners less
                                    !isLastInSequence ? "rounded-b-md" : ""
                                  }`}>
                                    <div className="text-sm break-words">
                                      {/* Override formatMessageContent for user messages to remove bottom margin */}
                                      {message.content.split('\n').map((line, idx) => (
                                        <p key={idx} className={idx < message.content.split('\n').length - 1 ? "mb-2" : "mb-0"}>
                                          {line}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className={`text-sm text-gray-800 dark:text-gray-200 leading-relaxed ${
                                  // If this is not the first message in a sequence, reduce top margin
                                  index > 0 && messages[index - 1].role === "assistant" ? "mt-1" : "mt-0"
                                }`}>
                                  {message.isTyping 
                                    ? message.displayedContent && formatMessageContent(message.displayedContent, true)
                                    : formatMessageContent(message.content)
                                  }
                                  {message.type === "table" && renderTableMessage(message)}
                                </div>
                              )}
                              
                              {/* Message footer with timestamp and action buttons */}
                              {message.role === "assistant" && !message.isTyping && (
                                <div className={`flex items-center justify-end mt-2 text-gray-400 dark:text-gray-500 ${
                                  index === messages.length - 1 ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
                                }`}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCopyMessage(message.content)}
                                    className="h-6 w-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                    title="Copy to clipboard"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                    </svg>
                                    <span className="sr-only">Copy</span>
                                  </Button>
                                  
                                  {/* Download CSV button for table messages */}
                                  {message.type === "table" && message.tableData && message.tableHeaders && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => downloadCSV(message.tableData!, message.tableHeaders!)}
                                      className="h-6 w-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                      title="Download CSV"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                      </svg>
                                      <span className="sr-only">Download CSV</span>
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRetry}
                                    className="h-6 w-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                    title="Regenerate response"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                      <path d="M3 3v5h5" />
                                    </svg>
                                    <span className="sr-only">Regenerate</span>
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleFeedback(index, "like")}
                                    className={`h-6 w-6 ${
                                      message.feedback === "like" 
                                        ? "text-green-500" 
                                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    } focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0`}
                                    title="Like response"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill={message.feedback === "like" ? "currentColor" : "none"}
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M7 10v12" />
                                      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                                    </svg>
                                    <span className="sr-only">Like</span>
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleFeedback(index, "dislike")}
                                    className={`h-6 w-6 ${
                                      message.feedback === "dislike" 
                                        ? "text-red-500" 
                                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    } focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0`}
                                    title="Dislike response"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill={message.feedback === "dislike" ? "currentColor" : "none"}
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M17 14V2" />
                                      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
                                    </svg>
                                    <span className="sr-only">Dislike</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Blinking loader when AI is processing but hasn't started typing */}
                      {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                        <div className="px-10 py-3 max-w-4xl mx-auto">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full loader-dot"></div>
                              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full loader-dot"></div>
                              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full loader-dot"></div>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">Thinking</span>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} className="pb-6" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-900">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end gap-2 p-4 relative"
              >
                <div className="flex-1 relative rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 shadow-sm overflow-hidden flex items-end">
                  <Textarea
                    ref={inputRef}
                    placeholder="Ask anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                    className="flex-1 focus-visible:ring-0 border-0 min-h-[48px] max-h-[200px] resize-none box-border flex items-center"
                    style={{ padding: '14px 16px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (input.trim()) {
                          handleSendMessage();
                        }
                      }
                    }}
                  />
                  <div className="flex-shrink-0 p-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading || !input.trim()}
                      className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      {isLoading ? (
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m22 2-7 20-4-9-9-4Z" />
                          <path d="M22 2 11 13" />
                        </svg>
                      )}
                      <span className="sr-only">Send</span>
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Help us improve</DialogTitle>
            <DialogDescription>
              Please tell us why this response wasn't helpful. Your feedback helps us improve our AI.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="What could be improved about this response?"
            value={detailedFeedback}
            onChange={(e) => setDetailedFeedback(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitDetailedFeedback}>
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Export the JebbieChat component with its openChat method for use in the TopNav
export function useJebbieChat() {
  const [isOpen, setIsOpen] = useState(false);
  
  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);
  
  return {
    openChat,
    JebbieChat: () => <JebbieChat isOpen={isOpen} setIsOpen={setIsOpen} />
  };
} 