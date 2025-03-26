import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * API handler for storing user feedback about AI responses
 * Records both likes, dislikes, and detailed feedback for analysis
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { feedback, messageContent, userId = 'anonymous', detailedFeedback = '' } = data;
    
    if (!feedback || !messageContent) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create a feedback record
    const feedbackRecord = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      feedback, // "like" or "dislike"
      messageContent,
      detailedFeedback,
      userId
    };
    
    // In a production app, you'd store this in a database
    // For this example, we'll log to the console and optionally write to a JSON file
    console.log('Received feedback:', feedbackRecord);
    
    // Optionally store in a local JSON file (create directory if it doesn't exist)
    const dataDir = path.join(process.cwd(), 'data');
    const feedbackFile = path.join(dataDir, 'feedback.json');
    
    try {
      // Create the data directory if it doesn't exist
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Read existing data or create an empty array
      let feedbackData = [];
      if (fs.existsSync(feedbackFile)) {
        const fileContent = fs.readFileSync(feedbackFile, 'utf8');
        feedbackData = JSON.parse(fileContent);
      }
      
      // Add the new feedback and write back to file
      feedbackData.push(feedbackRecord);
      fs.writeFileSync(feedbackFile, JSON.stringify(feedbackData, null, 2), 'utf8');
    } catch (fileError) {
      console.error('Error writing feedback to file:', fileError);
      // Continue execution even if file storage fails
    }
    
    return NextResponse.json({ success: true, id: feedbackRecord.id });
  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
} 