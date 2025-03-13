# Jebbit AI Insights

A conversational AI interface for Jebbit platform users to query their campaign data and get insights through natural language.

## Features

- **AI-Powered Query Interface**: Ask questions about your data in natural language
- **Multiple Output Formats**: View results as text, tables, or download as CSV
- **Contextual Understanding**: AI understands Jebbit-specific terminology and metrics
- **Suggested Prompts**: Pre-defined popular queries to help users get started
- **Data Privacy**: Users can only access data within their permissions

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **AI**: OpenAI API (GPT-4o)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `src/components/ai-insights/` - AI chat drawer component
- `src/app/api/ai-insights/` - API route for OpenAI integration
- `src/app/page.tsx` - Demo page

## Future Enhancements

- Save reports functionality
- Chart visualization
- Filter creation through chat
- Cross-brand benchmarking with privacy controls
- Integration with Mixpanel for usage tracking

## Security Considerations

- API key is stored securely in environment variables
- User permissions are validated before data access
- Cross-brand data access is limited to benchmarking only
- Sensitive competitor data is not accessible
