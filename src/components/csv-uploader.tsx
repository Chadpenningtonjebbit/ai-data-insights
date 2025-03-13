"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useCSVData, CSVData } from '@/hooks/use-csv-data';

export function CSVUploader() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { csvData, updateCSVData, clearCSVData } = useCSVData();

  const parseCSV = (content: string, fileName: string): CSVData | null => {
    try {
      // Split the content by newlines
      const lines = content.split(/\r\n|\n/);
      
      // Remove empty lines
      const nonEmptyLines = lines.filter(line => line.trim() !== '');
      
      if (nonEmptyLines.length === 0) {
        setError('The CSV file is empty');
        return null;
      }

      // Try to find the best header row by analyzing the file
      let headerRowIndex = 0; // Default to first row
      let bestHeaderScore = 0;
      let bestDataRowCount = 0;

      // Try each of the first 10 rows (or fewer if file is smaller) as potential header
      const maxRowsToCheck = Math.min(10, nonEmptyLines.length - 1);
      
      for (let i = 0; i < maxRowsToCheck; i++) {
        const potentialHeaderLine = nonEmptyLines[i];
        const potentialHeaders = parseCSVLine(potentialHeaderLine);
        
        // Skip if empty headers
        if (potentialHeaders.filter(h => h.trim() !== '').length === 0) {
          continue;
        }
        
        // Count how many rows would be valid with these headers
        let validRowCount = 0;
        let headerScore = 0;
        
        // Check if headers look like actual headers (not numeric values)
        const headersLookLikeHeaders = potentialHeaders.some(header => 
          isNaN(Number(header)) && header.trim() !== ''
        );
        
        if (headersLookLikeHeaders) {
          headerScore += 5; // Bonus for non-numeric headers
        }
        
        // Check consistency of rows after this potential header
        for (let j = i + 1; j < nonEmptyLines.length; j++) {
          const values = parseCSVLine(nonEmptyLines[j]);
          if (values.length === potentialHeaders.length) {
            validRowCount++;
          }
        }
        
        // Calculate a score based on valid rows and header quality
        const score = validRowCount + headerScore;
        
        // If this is better than our previous best, update
        if (score > bestHeaderScore || 
            (score === bestHeaderScore && validRowCount > bestDataRowCount)) {
          headerRowIndex = i;
          bestHeaderScore = score;
          bestDataRowCount = validRowCount;
        }
      }
      
      // Use the best header row we found
      const headerLine = nonEmptyLines[headerRowIndex];
      let headers = parseCSVLine(headerLine);
      
      // Clean up headers - remove empty headers and trim whitespace
      headers = headers.map(h => h.trim()).filter(h => h !== '');
      
      // If we still don't have valid headers, try to generate them
      if (headers.length === 0) {
        // Try to infer header count from the first data row
        const firstDataRow = parseCSVLine(nonEmptyLines[headerRowIndex + 1] || '');
        headers = firstDataRow.map((_, index) => `Column${index + 1}`);
        
        if (headers.length === 0) {
          setError('Could not determine CSV structure');
          return null;
        }
      }
      
      // Parse the data rows (all rows after the header)
      const rows: Record<string, string>[] = [];
      for (let i = headerRowIndex + 1; i < nonEmptyLines.length; i++) {
        const values = parseCSVLine(nonEmptyLines[i]);
        
        // Skip rows with all empty values
        if (values.every(v => v.trim() === '')) {
          continue;
        }
        
        // For rows with fewer values than headers, pad with empty strings
        while (values.length < headers.length) {
          values.push('');
        }
        
        // For rows with more values than headers, truncate
        if (values.length > headers.length) {
          values.length = headers.length;
        }
        
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          // Use a default header name if empty
          const headerName = header || `Column${index + 1}`;
          row[headerName] = values[index] || '';
        });
        
        rows.push(row);
      }
      
      if (rows.length === 0) {
        setError('No valid data rows found in the CSV file');
        return null;
      }
      
      console.log(`CSV parsed successfully: Found header at row ${headerRowIndex + 1}, with ${headers.length} columns and ${rows.length} data rows`);
      
      return {
        headers,
        rows,
        fileName
      };
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setError('Failed to parse CSV file');
      return null;
    }
  };
  
  // Helper function to parse a CSV line, handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        // If we see a quote, toggle the inQuotes flag
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        // If we see a comma and we're not in quotes, end the current value
        result.push(current);
        current = '';
      } else {
        // Otherwise, add the character to the current value
        current += char;
      }
    }
    
    // Add the last value
    result.push(current);
    
    return result;
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    processFile(file);
  };
  
  const processFile = (file: File) => {
    setError(null);
    
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsedData = parseCSV(content, file.name);
      
      if (parsedData) {
        updateCSVData(parsedData);
        toast({
          title: 'CSV Uploaded Successfully',
          description: `Loaded ${parsedData.rows.length} rows with ${parsedData.headers.length} columns`,
        });
      }
    };
    
    reader.onerror = () => {
      setError('Error reading the file');
    };
    
    reader.readAsText(file);
  };
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleClearData = () => {
    clearCSVData();
    toast({
      title: 'Data Cleared',
      description: 'The CSV data has been cleared',
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload CSV Data</CardTitle>
        <CardDescription>
          Upload a CSV file to analyze with AI insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        {csvData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{csvData.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {csvData.rows.length} rows × {csvData.headers.length} columns
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearData}>
                Clear Data
              </Button>
            </div>
            <div className="border rounded-md p-4">
              <p className="font-medium mb-2">Column Headers:</p>
              <div className="flex flex-wrap gap-2">
                {csvData.headers.map((header, index) => (
                  <span key={index} className="bg-muted px-2 py-1 rounded text-sm">
                    {header}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your data is ready! Ask questions about your data in the AI chat.
            </p>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/20'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".csv"
            />
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Drag & Drop your CSV file</h3>
            <p className="mt-2 text-sm text-muted-foreground mb-4">
              or click the button below to browse files
            </p>
            <Button onClick={handleButtonClick}>Select CSV File</Button>
            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Your data is processed locally and never sent to a server until you ask a question.
      </CardFooter>
    </Card>
  );
} 