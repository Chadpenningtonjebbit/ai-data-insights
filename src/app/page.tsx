import { JebbieChat } from "@/components/jebbie/chat-drawer";
import { CSVUploader } from "@/components/csv-uploader";
import { DebugCSV } from "@/components/debug-csv";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Jebbie Platform</h1>
          <p className="text-gray-600">Upload your CSV data and get AI-powered insights</p>
        </div>
        
        <CSVUploader />
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Upload your data and use Jebbie to analyze it. Try asking questions about your data!</p>
        </div>
      </div>
      
      <JebbieChat />
      <DebugCSV />
    </main>
  );
}
