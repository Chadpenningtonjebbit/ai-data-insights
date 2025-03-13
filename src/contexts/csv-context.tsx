"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the CSV data type
export interface CSVData {
  headers: string[];
  rows: Record<string, string>[];
  fileName?: string;
}

// Define the context type
interface CSVContextType {
  csvData: CSVData | null;
  updateCSVData: (data: CSVData | null) => void;
  clearCSVData: () => void;
}

// Create the context with a default value
const CSVContext = createContext<CSVContextType>({
  csvData: null,
  updateCSVData: () => {},
  clearCSVData: () => {},
});

// Create a provider component
export function CSVProvider({ children }: { children: React.ReactNode }) {
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load CSV data from localStorage on component mount
  useEffect(() => {
    console.log("CSVProvider: Initializing and checking localStorage");
    
    // Use a try-catch block to handle any localStorage errors
    try {
      const storedData = localStorage.getItem('csvData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          console.log("CSVProvider: Found stored data:", {
            fileName: parsedData.fileName,
            headers: parsedData.headers,
            rowCount: parsedData.rows?.length
          });
          setCsvData(parsedData);
        } catch (error) {
          console.error('Error parsing stored CSV data:', error);
          localStorage.removeItem('csvData');
        }
      } else {
        console.log("CSVProvider: No stored data found");
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
    
    setIsInitialized(true);
  }, []);

  // Save CSV data to localStorage whenever it changes
  useEffect(() => {
    // Skip during initialization to avoid overwriting with null
    if (!isInitialized) return;
    
    console.log("CSVProvider: CSV data changed:", csvData ? {
      fileName: csvData.fileName,
      headers: csvData.headers,
      rowCount: csvData.rows.length
    } : "null");
    
    try {
      if (csvData) {
        localStorage.setItem('csvData', JSON.stringify(csvData));
        console.log("CSVProvider: Saved data to localStorage");
      } else {
        localStorage.removeItem('csvData');
        console.log("CSVProvider: Removed data from localStorage");
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }, [csvData, isInitialized]);

  // Function to update CSV data
  const updateCSVData = (data: CSVData | null) => {
    console.log("CSVProvider: updateCSVData called with:", data ? {
      fileName: data.fileName,
      headers: data.headers,
      rowCount: data.rows.length
    } : "null");
    setCsvData(data);
  };

  // Function to clear CSV data
  const clearCSVData = () => {
    console.log("CSVProvider: clearCSVData called");
    setCsvData(null);
    try {
      localStorage.removeItem('csvData');
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  };

  return (
    <CSVContext.Provider value={{ csvData, updateCSVData, clearCSVData }}>
      {children}
    </CSVContext.Provider>
  );
}

// Create a custom hook to use the CSV context
export function useCSVData() {
  return useContext(CSVContext);
} 