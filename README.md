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

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- An OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd datatesting
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   - Edit `.env.local` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```

4. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

## Important Notes

- **API Key**: The OpenAI API key is required for the application to function properly. Each user needs to provide their own API key.
- **Environment Variables**: Never commit your `.env.local` file to the repository as it contains sensitive information.
- **API Usage**: Be aware that using the OpenAI API incurs costs based on usage.

## Troubleshooting

### "OpenAI API key is not configured" Error
If you see this error, it means the application cannot find your OpenAI API key. Make sure:
1. You've created a `.env.local` file with your API key
2. The key is correctly formatted (starts with "sk-")
3. The environment variable is named exactly `OPENAI_API_KEY`

### Deployment
For deployment to platforms like Vercel, you'll need to set the `OPENAI_API_KEY` environment variable in your project settings.

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
