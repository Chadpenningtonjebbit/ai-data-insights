"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define data types
export interface CSVData {
  headers: string[];
  rows: Record<string, string>[];
  fileName?: string;
}

export type DataSourceType = 'platform' | 'brand' | 'csv';

// Define sample data for the platform and brand options
const PLATFORM_SAMPLE_DATA: CSVData = {
  headers: ['Engagement Rate', 'Completion Rate', 'Average Time Spent', 'Conversion Rate', 'Click-through Rate', 'Bounce Rate'],
  rows: [
    { 
      'Engagement Rate': '68%', 
      'Completion Rate': '72%', 
      'Average Time Spent': '2m 45s', 
      'Conversion Rate': '8.3%', 
      'Click-through Rate': '12.5%', 
      'Bounce Rate': '24.7%' 
    },
    { 
      'Engagement Rate': '71%', 
      'Completion Rate': '75%', 
      'Average Time Spent': '3m 12s', 
      'Conversion Rate': '9.1%', 
      'Click-through Rate': '13.2%', 
      'Bounce Rate': '22.3%' 
    },
  ],
  fileName: 'Platform-wide Benchmarks'
};

const BRAND_SAMPLE_DATA: Record<string, CSVData> = {
  'Nike': {
    headers: ['Product', 'Stock', 'Sales', 'Revenue', 'Profit Margin'],
    rows: [
      { 'Product': 'Air Max', 'Stock': '2340', 'Sales': '1250', 'Revenue': '$125000', 'Profit Margin': '42%' },
      { 'Product': 'Jordan', 'Stock': '1560', 'Sales': '980', 'Revenue': '$147000', 'Profit Margin': '48%' },
      { 'Product': 'Running Shoes', 'Stock': '3200', 'Sales': '1640', 'Revenue': '$114800', 'Profit Margin': '38%' },
      { 'Product': 'Training Gear', 'Stock': '4100', 'Sales': '2200', 'Revenue': '$88000', 'Profit Margin': '32%' },
    ],
    fileName: 'Nike Brand Data'
  },
  'Adidas': {
    headers: ['Product', 'Stock', 'Sales', 'Revenue', 'Profit Margin'],
    rows: [
      { 'Product': 'Ultraboost', 'Stock': '1850', 'Sales': '920', 'Revenue': '$92000', 'Profit Margin': '39%' },
      { 'Product': 'Originals', 'Stock': '2100', 'Sales': '1350', 'Revenue': '$108000', 'Profit Margin': '41%' },
      { 'Product': 'Football', 'Stock': '1650', 'Sales': '840', 'Revenue': '$75600', 'Profit Margin': '36%' },
      { 'Product': 'Running', 'Stock': '2900', 'Sales': '1580', 'Revenue': '$94800', 'Profit Margin': '34%' },
    ],
    fileName: 'Adidas Brand Data'
  },
  'Puma': {
    headers: ['Product', 'Stock', 'Sales', 'Revenue', 'Profit Margin'],
    rows: [
      { 'Product': 'RS-X', 'Stock': '1240', 'Sales': '680', 'Revenue': '$58000', 'Profit Margin': '35%' },
      { 'Product': 'Suede', 'Stock': '1680', 'Sales': '920', 'Revenue': '$64400', 'Profit Margin': '38%' },
      { 'Product': 'Training', 'Stock': '2200', 'Sales': '1150', 'Revenue': '$69000', 'Profit Margin': '32%' },
      { 'Product': 'Motorsport', 'Stock': '980', 'Sales': '420', 'Revenue': '$42000', 'Profit Margin': '42%' },
    ],
    fileName: 'Puma Brand Data'
  }
};

// Define the brands list for the dropdown
export const AVAILABLE_BRANDS = Object.keys(BRAND_SAMPLE_DATA);

// Define the context type
interface DataSourceContextType {
  dataSourceType: DataSourceType;
  setDataSourceType: (type: DataSourceType) => void;
  csvData: CSVData | null;
  updateCSVData: (data: CSVData | null) => void;
  clearCSVData: () => void;
  selectedBrand: string | null;
  setSelectedBrand: (brand: string | null) => void;
  currentData: CSVData | null; // The currently active data based on the selected source
}

// Create the context with a default value
const DataSourceContext = createContext<DataSourceContextType>({
  dataSourceType: 'csv',
  setDataSourceType: () => {},
  csvData: null,
  updateCSVData: () => {},
  clearCSVData: () => {},
  selectedBrand: null,
  setSelectedBrand: () => {},
  currentData: null,
});

// Create a provider component
export function DataSourceProvider({ children }: { children: React.ReactNode }) {
  const [dataSourceType, setDataSourceType] = useState<DataSourceType>('csv');
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Derived state for the current data based on source type
  const currentData = React.useMemo(() => {
    switch (dataSourceType) {
      case 'platform':
        return PLATFORM_SAMPLE_DATA;
      case 'brand':
        return selectedBrand ? BRAND_SAMPLE_DATA[selectedBrand] : null;
      case 'csv':
        return csvData;
      default:
        return null;
    }
  }, [dataSourceType, csvData, selectedBrand]);

  // Load CSV data from localStorage on component mount
  useEffect(() => {
    console.log("DataSourceProvider: Initializing and checking localStorage");
    
    // Use a try-catch block to handle any localStorage errors
    try {
      // Load CSV data if available
      const storedData = localStorage.getItem('csvData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          console.log("DataSourceProvider: Found stored CSV data:", {
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
        console.log("DataSourceProvider: No stored CSV data found");
      }
      
      // Load data source type preference if available
      const storedSourceType = localStorage.getItem('dataSourceType');
      if (storedSourceType && ['platform', 'brand', 'csv'].includes(storedSourceType)) {
        setDataSourceType(storedSourceType as DataSourceType);
        console.log(`DataSourceProvider: Using stored source type: ${storedSourceType}`);
      }
      
      // Load selected brand if available
      const storedBrand = localStorage.getItem('selectedBrand');
      if (storedBrand && AVAILABLE_BRANDS.includes(storedBrand)) {
        setSelectedBrand(storedBrand);
        console.log(`DataSourceProvider: Using stored selected brand: ${storedBrand}`);
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
    
    console.log("DataSourceProvider: CSV data changed:", csvData ? {
      fileName: csvData.fileName,
      headers: csvData.headers,
      rowCount: csvData.rows.length
    } : "null");
    
    try {
      if (csvData) {
        localStorage.setItem('csvData', JSON.stringify(csvData));
        console.log("DataSourceProvider: Saved CSV data to localStorage");
      } else {
        localStorage.removeItem('csvData');
        console.log("DataSourceProvider: Removed CSV data from localStorage");
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }, [csvData, isInitialized]);

  // Save data source type preference whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      localStorage.setItem('dataSourceType', dataSourceType);
      console.log(`DataSourceProvider: Saved source type preference: ${dataSourceType}`);
    } catch (error) {
      console.error('Error saving data source type to localStorage:', error);
    }
  }, [dataSourceType, isInitialized]);

  // Save selected brand whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      if (selectedBrand) {
        localStorage.setItem('selectedBrand', selectedBrand);
        console.log(`DataSourceProvider: Saved selected brand: ${selectedBrand}`);
      } else {
        localStorage.removeItem('selectedBrand');
      }
    } catch (error) {
      console.error('Error saving selected brand to localStorage:', error);
    }
  }, [selectedBrand, isInitialized]);

  // Function to update CSV data
  const updateCSVData = (data: CSVData | null) => {
    console.log("DataSourceProvider: updateCSVData called with:", data ? {
      fileName: data.fileName,
      headers: data.headers,
      rowCount: data.rows.length
    } : "null");
    setCsvData(data);
  };

  // Function to clear CSV data
  const clearCSVData = () => {
    console.log("DataSourceProvider: clearCSVData called");
    setCsvData(null);
    try {
      localStorage.removeItem('csvData');
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  };

  return (
    <DataSourceContext.Provider value={{ 
      dataSourceType, 
      setDataSourceType, 
      csvData, 
      updateCSVData, 
      clearCSVData,
      selectedBrand,
      setSelectedBrand,
      currentData
    }}>
      {children}
    </DataSourceContext.Provider>
  );
}

// Create a custom hook to use the data source context
export function useDataSource() {
  return useContext(DataSourceContext);
} 