"use client";

import { useCSVData } from '@/hooks/use-csv-data';

export function DebugCSV() {
  const { csvData } = useCSVData();
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-md text-xs max-w-xs overflow-auto max-h-60 z-50">
      <h3 className="font-bold mb-2">CSV Data Debug</h3>
      {csvData ? (
        <>
          <p>Filename: {csvData.fileName}</p>
          <p>Headers: {csvData.headers.join(', ')}</p>
          <p>Rows: {csvData.rows.length}</p>
          <p>Sample row: {JSON.stringify(csvData.rows[0])}</p>
        </>
      ) : (
        <p>No CSV data available</p>
      )}
    </div>
  );
} 