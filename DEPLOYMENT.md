# Deployment Guide for Jebbie Chat Application

This guide provides instructions for deploying the Jebbie Chat application for team testing.

## Vercel Deployment (Recommended)

### Prerequisites
- A GitHub, GitLab, or Bitbucket account
- A Vercel account (free tier is sufficient)
- Your OpenAI API key

### Steps

1. **Push your code to a Git repository**
   - Create a new repository on GitHub/GitLab/Bitbucket
   - Push your code to the repository

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com) and sign in
   - Click "Add New" > "Project"
   - Import your Git repository
   - Configure the project:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: `npm run build`
     - Output Directory: .next
   - Add environment variables:
     - OPENAI_API_KEY: Your OpenAI API key
     - (Optional) OPENAI_ORG_ID: Your OpenAI organization ID if you have one
   - Click "Deploy"

3. **Access your deployed application**
   - Once deployment is complete, Vercel will provide a URL (e.g., `https://your-project.vercel.app`)
   - Share this URL with your team for testing

### Updating the Deployment

- Any changes pushed to the main branch will automatically trigger a new deployment
- For feature branches, Vercel creates preview deployments

## Alternative Deployment Options

### Local Development Server

For quick testing without deploying:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Access the application at http://localhost:3000

### Docker Deployment

For more control or deploying on your own infrastructure:

1. **Create a Dockerfile** in your project root:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

2. **Update your `next.config.ts`** to enable standalone output:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
};

export default nextConfig;
```

3. **Build and run the Docker container**:

```bash
docker build -t jebbie-chat .
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key_here jebbie-chat
```

## Important Considerations

### Environment Variables

- Never commit your API keys to the repository
- Use environment variables in your deployment platform
- For local testing, use a `.env.local` file (already in .gitignore)

### OpenAI API Usage

- Be aware of OpenAI API usage costs when multiple people are testing
- Consider implementing rate limiting for team testing
- Monitor your OpenAI API usage in the OpenAI dashboard

### Troubleshooting

- **Build Errors**: If you encounter build errors, check the Vercel build logs
- **API Errors**: Check that your OpenAI API key is correctly set up
- **Runtime Errors**: Use browser developer tools to check for JavaScript errors

### Getting Help

If you encounter issues with the deployment, please contact the development team for assistance. 