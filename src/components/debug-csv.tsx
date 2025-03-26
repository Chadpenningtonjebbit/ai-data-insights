"use client";

import { useDataSource } from '@/hooks/use-data-source';

export function DebugCSV() {
  const { dataSourceType, selectedBrand, csvData, currentData } = useDataSource();
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-md text-xs max-w-xs overflow-auto max-h-60 z-50">
      <h3 className="font-bold mb-2">Data Source Debug</h3>
      <p>Source type: {dataSourceType}</p>
      {dataSourceType === 'brand' && <p>Selected brand: {selectedBrand}</p>}
      
      {currentData ? (
        <>
          <p>Source: {
            dataSourceType === 'platform' ? 'Platform-wide data' : 
            dataSourceType === 'brand' ? selectedBrand : 
            csvData?.fileName
          }</p>
          <p>Headers: {currentData.headers.join(', ')}</p>
          <p>Rows: {currentData.rows.length}</p>
          <p>Sample row: {JSON.stringify(currentData.rows[0])}</p>
        </>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
} 