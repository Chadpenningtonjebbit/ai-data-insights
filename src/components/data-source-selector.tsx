"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataSource, DataSourceType, AVAILABLE_BRANDS } from '@/hooks/use-data-source';

export function DataSourceSelector() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    dataSourceType,
    setDataSourceType,
    csvData, 
    updateCSVData, 
    clearCSVData,
    selectedBrand,
    setSelectedBrand,
    currentData
  } = useDataSource();

  const parseCSV = (content: string, fileName: string) => {
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
  }, []);
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleClearData = () => {
    clearCSVData();
  };
  
  const handleSourceTypeChange = (value: string) => {
    setDataSourceType(value as DataSourceType);
    
    if (value === 'brand' && !selectedBrand && AVAILABLE_BRANDS.length > 0) {
      // Auto-select the first brand if switching to brand specific and no brand is selected
      setSelectedBrand(AVAILABLE_BRANDS[0]);
    }
  };
  
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
  };
  
  return (
    <div className="w-full">
      <Tabs
        defaultValue={dataSourceType}
        value={dataSourceType}
        onValueChange={handleSourceTypeChange}
        className="w-full max-w-[650px] mx-auto"
      >
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger value="platform">Platform-wide</TabsTrigger>
          <TabsTrigger value="brand">Brand-specific</TabsTrigger>
          <TabsTrigger value="csv">Uploaded CSV</TabsTrigger>
        </TabsList>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {dataSourceType === 'platform' 
                ? 'Platform-wide' 
                : dataSourceType === 'brand' 
                  ? 'Brand-specific'
                  : 'Uploaded CSV'
              }
            </CardTitle>
            <CardDescription>
              {dataSourceType === 'platform' 
                ? 'Access benchmarking data across all your brands' 
                : dataSourceType === 'brand' 
                  ? 'View data for a specific brand'
                  : 'Upload and analyze your own CSV data'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="platform" className="mt-0">
              <div className="space-y-4">
                {currentData && (
                  <>
                    <div className="border rounded-md p-4">
                      <div className="flex flex-wrap gap-2">
                        {currentData.headers.map((metric, index) => (
                          <span key={index} className="bg-muted px-2 py-1 rounded text-sm">
                            {metric}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="brand" className="mt-0">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Select Brand</p>
                  <Select 
                    value={selectedBrand || ''} 
                    onValueChange={handleBrandChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_BRANDS.map(brand => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {dataSourceType === 'brand' && currentData && (
                  <div className="mt-4 space-y-4">
                    <div className="border rounded-md p-4">
                      <div className="flex flex-wrap gap-2">
                        {currentData.headers.map((header, index) => (
                          <span key={index} className="bg-muted px-2 py-1 rounded text-sm">
                            {header}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="csv" className="mt-0">
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
                    <div className="flex flex-wrap gap-2">
                      {csvData.headers.map((header, index) => (
                        <span key={index} className="bg-muted px-2 py-1 rounded text-sm">
                          {header}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg py-12 px-6 text-center flex flex-col items-center justify-center ${
                    isDragging ? 'border-blue-600 bg-blue-600/10' : 'border-muted-foreground/20'
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
                  <h3 className="text-lg font-semibold">Drag & Drop your CSV file</h3>
                  <p className="mt-2 text-sm text-muted-foreground mb-4">
                    or click the button below to browse files
                  </p>
                  <Button onClick={handleButtonClick} className="bg-blue-600 hover:bg-blue-700 text-white">Select CSV File</Button>
                  {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
                </div>
              )}
            </TabsContent>
          </CardContent>
          
          <CardFooter className="text-xs text-muted-foreground">
            
          </CardFooter>
        </Card>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Your data is processed locally and never sent to a server until you ask a question.
          </p>
        </div>
      </Tabs>
    </div>
  );
} 