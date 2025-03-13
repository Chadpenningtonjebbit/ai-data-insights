import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID, // Add organization ID if available
});

// Log API key status (not the actual key) for debugging
console.log("OpenAI API Key status:", {
  exists: !!process.env.OPENAI_API_KEY,
  length: process.env.OPENAI_API_KEY?.length || 0,
  prefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'missing'
});

export async function POST(request: Request) {
  try {
    const { message, userId, brandId, csvData } = await request.json();
    
    console.log("Received message:", message);
    
    // Special debug mode - if message contains "debug nba" or "use nba", return NBA sample data
    if (message.toLowerCase().includes("debug nba") || 
        message.toLowerCase().includes("use nba") || 
        message.toLowerCase().includes("nba sample")) {
      console.log("Debug mode activated - using NBA sample data");
      const insights = generateNBASampleResponse(message);
      return NextResponse.json({
        message: {
          role: "assistant",
          content: insights.message,
          timestamp: new Date().toISOString(),
          type: insights.data ? "table" : "text",
          ...(insights.data && { tableData: insights.data }),
          ...(insights.headers && { tableHeaders: insights.headers })
        }
      });
    }
    
    // Check if CSV data was provided in the request
    if (csvData) {
      // Add more detailed logging of the CSV structure
      console.log("CSV data received in request:", {
        headers: csvData.headers,
        rowCount: csvData.rows.length,
        firstRowKeys: csvData.rows.length > 0 ? Object.keys(csvData.rows[0]) : [],
        firstRowValues: csvData.rows.length > 0 ? Object.values(csvData.rows[0]) : []
      });
      
      // If message contains "debug csv", print the entire CSV structure
      if (message.toLowerCase().includes("debug csv")) {
        console.log("Debug mode activated - printing full CSV structure");
        console.log("Full CSV headers:", JSON.stringify(csvData.headers));
        console.log("Full CSV first row:", JSON.stringify(csvData.rows[0]));
        console.log("Full CSV second row:", csvData.rows.length > 1 ? JSON.stringify(csvData.rows[1]) : "No second row");
        
        // Create a more detailed debug response
        let debugInfo = `CSV Debug Information:\n\n`;
        debugInfo += `Headers (${csvData.headers.length}): ${JSON.stringify(csvData.headers)}\n\n`;
        debugInfo += `First Row Keys: ${JSON.stringify(Object.keys(csvData.rows[0]))}\n\n`;
        debugInfo += `First Row Values: ${JSON.stringify(Object.values(csvData.rows[0]))}\n\n`;
        debugInfo += `Total Rows: ${csvData.rows.length}\n\n`;
        
        // Add sample data for the first 5 rows
        debugInfo += `Sample Data (first 5 rows):\n`;
        for (let i = 0; i < Math.min(5, csvData.rows.length); i++) {
          debugInfo += `Row ${i+1}: ${JSON.stringify(csvData.rows[i])}\n`;
        }
        
        return NextResponse.json({
          message: {
            role: "assistant",
            content: debugInfo,
            timestamp: new Date().toISOString(),
            type: "text"
          }
        });
      }
      
      // Clean up CSV data - filter out empty headers and ensure we have valid data
      let cleanedCsvData = {
        headers: csvData.headers.filter((h: string) => h !== ''),
        rows: csvData.rows
      };
      
      // If all headers were empty, try to extract headers from the first row of data
      if (cleanedCsvData.headers.length === 0 && csvData.rows.length > 0) {
        console.log("No valid headers found, attempting to extract headers from data");
        const firstRow = csvData.rows[0];
        console.log("First row data:", firstRow);
        
        // Try to get headers from the keys of the first row
        const potentialHeaders = Object.keys(firstRow).filter(k => k !== '');
        
        if (potentialHeaders.length > 0) {
          cleanedCsvData.headers = potentialHeaders;
          // Only skip the first row if it doesn't contain actual data
          const firstRowIsHeaders = potentialHeaders.some(header => 
            typeof firstRow[header] === 'string' && 
            (firstRow[header] === header || firstRow[header] === '')
          );
          
          if (firstRowIsHeaders) {
            cleanedCsvData.rows = csvData.rows.slice(1); // Skip the first row as it's headers
            console.log("First row appears to be headers, skipping it");
          } else {
            console.log("First row contains data, keeping all rows");
          }
          
          console.log("Extracted headers:", cleanedCsvData.headers);
          console.log("Cleaned data now has", cleanedCsvData.rows.length, "rows");
        }
      }
      
      // Force use of sample data for debugging
      if (message.toLowerCase().includes("use sample")) {
        console.log("User requested sample data, using mock data");
        const insights = generateSampleResponse(message);
        return NextResponse.json({
          message: {
            role: "assistant",
            content: insights.message,
            timestamp: new Date().toISOString(),
            type: insights.data ? "table" : "text",
            ...(insights.data && { tableData: insights.data }),
            ...(insights.headers && { tableHeaders: insights.headers })
          }
        });
      }
      
      // Check if the cleaned CSV data is valid
      if (cleanedCsvData.headers.length === 0 || cleanedCsvData.rows.length === 0) {
        console.log("CSV data is still invalid after cleaning");
        return NextResponse.json({
          message: {
            role: "assistant",
            content: "I couldn't analyze your data because the CSV file appears to be empty or invalid. Please ensure your CSV has column headers and data rows. If you're exporting from Google Sheets, make sure the first row contains your column headers.\n\nFor debugging: Headers found: " + (cleanedCsvData.headers.length) + ", Rows found: " + (cleanedCsvData.rows.length),
            timestamp: new Date().toISOString(),
            type: "text"
          }
        });
      }
      
      // Generate insights from the cleaned CSV data using OpenAI
      const insights = await generateInsightsFromOpenAI(cleanedCsvData, message);
      return NextResponse.json({
        message: {
          role: "assistant",
          content: insights.message,
          timestamp: new Date().toISOString(),
          type: insights.data ? "table" : "text",
          ...(insights.data && { tableData: insights.data }),
          ...(insights.headers && { tableHeaders: insights.headers })
        }
      });
    } else {
      // If no CSV data was provided, return a message asking the user to upload data
      return NextResponse.json({
        message: {
          role: "assistant",
          content: "Please upload a CSV file first to analyze data. I need data to provide insights.",
          timestamp: new Date().toISOString(),
          type: "text"
        }
      });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        message: {
          role: "assistant",
          content: "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date().toISOString(),
          type: "text"
        },
      },
      { status: 500 }
    );
  }
}

// Function to generate insights from uploaded CSV data using OpenAI
async function generateInsightsFromOpenAI(
  csvData: { headers: string[], rows: Record<string, string>[] }, 
  query: string
): Promise<{ message: string, headers?: string[], data?: Record<string, string>[] }> {
  console.log("Generating insights from OpenAI with query:", query);
  
  const { headers, rows } = csvData;
  
  // If the CSV data is empty or invalid, use sample data for testing
  if (headers.length === 0 || headers[0] === '' || rows.length === 0) {
    console.log("Using sample data for testing since CSV data is empty or invalid");
    return generateSampleResponse(query);
  }
  
  // Prepare data for OpenAI
  // Convert the first 50 rows (or all if less) to a string representation
  const maxRowsToSend = Math.min(rows.length, 50);
  const csvSample = [
    headers.join(','),
    ...rows.slice(0, maxRowsToSend).map(row => 
      headers.map(header => row[header]).join(',')
    )
  ].join('\n');
  
  // Prepare a system message that instructs the model on how to analyze the data
  const systemMessage = `
You are a data analysis assistant named Jebbie with a friendly, helpful personality. You will be provided with CSV data and a user query about that data.
Analyze the data and provide a concise, accurate response to the query.

When responding:
1. Be contextually appropriate - if the user is asking a question, respond directly with the answer. Only use phrases like "Sure thing!" or "I'd be happy to help with that!" when the user is making a request rather than asking a question.
2. Use a conversational, upbeat tone throughout your response
3. Include emojis occasionally to add personality (1-2 per response)
4. Keep your responses concise and to the point - focus on the most important insights
5. DO NOT include follow-up questions at the end of your response

For text responses, use proper formatting to improve readability:
- Use # and ## for headers and subheaders
- Use bullet points (•) for lists
- Use line breaks between paragraphs
- Use **bold** for emphasis on important points
- Structure your analysis with clear sections

The CSV data has the following structure:
- Headers: ${headers.join(', ')}
- Total rows: ${rows.length}

IMPORTANT: Choose ONLY ONE response format based on what best answers the user's query:

OPTION 1 - TEXT RESPONSE: If the query is best answered with a narrative explanation, provide a concise text analysis with your friendly personality. Use proper formatting (headers, bullet points, line breaks) to make it readable.

OPTION 2 - TABLE RESPONSE: If the query is best answered with structured data, return your analysis in a tabular format that can be displayed to the user.

Your response MUST be in valid JSON format. If you choose OPTION 2 (table response), format your JSON response as follows:
{
  "message": "[Your contextually appropriate response with a brief explanation]",
  "headers": ["Column1", "Column2", "Column3"],
  "data": [
    {"Column1": "Value1", "Column2": "Value2", "Column3": "Value3"},
    {"Column1": "Value4", "Column2": "Value5", "Column3": "Value6"}
  ]
}

If you choose OPTION 1 (text response), format your JSON response as follows:
{
  "message": "[Your contextually appropriate response]:\n\n## Key Insights\n\n• First important point\n• Second important point\n• Third important point"
}

DO NOT include both a detailed text explanation AND a table in your response. Choose the format that best answers the user's query.
`;

  try {
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: `CSV Data:\n${csvSample}\n\nUser Query: ${query}\n\nPlease respond with a JSON object.` }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });
    
    // Extract the response content
    const content = response.choices[0].message.content;
    
    if (!content) {
      return {
        message: "I couldn't generate insights from your data. Please try a different query."
      };
    }
    
    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(content);
      
      // Check if we have a tabular response
      if (parsedResponse.headers && parsedResponse.data && Array.isArray(parsedResponse.headers) && Array.isArray(parsedResponse.data)) {
        return {
          message: parsedResponse.message || "Here's the analysis of your data:",
          headers: parsedResponse.headers,
          data: parsedResponse.data
        };
      } else {
        // Return just the message if no tabular data
        return {
          message: parsedResponse.message || content
        };
      }
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      // If parsing fails, return the raw content
      return {
        message: content
      };
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    // Log more detailed error information
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    return {
      message: "I encountered an error analyzing your data. Please try again with a different query. Error: " + (error instanceof Error ? error.message : String(error))
    };
  }
}

// Function to generate NBA-specific sample responses for testing
function generateNBASampleResponse(query: string): { message: string, headers?: string[], data?: Record<string, string>[] } {
  // Special case for "anything else" type questions - text only response
  if (query.toLowerCase().includes("anything else") || 
      query.toLowerCase().includes("should know") || 
      query.toLowerCase().includes("more info")) {
    return {
      message: "# NBA G League Survey Insights 🏀\n\nHere's a deeper dive into the data:\n\n## Key Patterns\n\n• There's a **significant drop-off** between screen S5 and S6 (21% of users don't complete the final screen)\n\n• 'Laid back & low key' style preference correlates strongly with choosing Kobes as favorite kicks\n\n• Users who selected 'High-scoring guard' as their playing style were more likely to complete the entire survey"
    };
  }
  
  // For queries about total responses - table response
  if (query.toLowerCase().includes("total responses") || query.toLowerCase().includes("count")) {
    return {
      message: "Here's the total number of responses for each screen in the NBA G League survey 🏀. Screen S1 had the most responses with 1,096!",
      headers: ["Screen Number", "Screen Name", "Total Responses"],
      data: [
        { "Screen Number": "S1", "Screen Name": "WHICH IGNITE PLAYER ARE YOU?", "Total Responses": "1096" },
        { "Screen Number": "S2", "Screen Name": "WHICH MATCHES YOUR STYLE", "Total Responses": "974" },
        { "Screen Number": "S3", "Screen Name": "WHAT ARE YOUR GO-TO KICKS", "Total Responses": "962" },
        { "Screen Number": "S4", "Screen Name": "WHAT IS YOUR PLAYING STYLE", "Total Responses": "949" },
        { "Screen Number": "S5", "Screen Name": "WOULD YOU RATHER", "Total Responses": "939" },
        { "Screen Number": "S6", "Screen Name": "WE HAVE YOUR RESULTS", "Total Responses": "742" }
      ]
    };
  }
  
  // For queries about response rates - table response
  if (query.toLowerCase().includes("response rate") || query.toLowerCase().includes("percentage")) {
    return {
      message: "The response rates for each screen in the NBA G League survey 📈 show interesting patterns. The first screen had a perfect 100% response rate, but notice how it drops to 79% by the final screen.",
      headers: ["Screen Number", "Screen Name", "Response Rate (%)"],
      data: [
        { "Screen Number": "S1", "Screen Name": "WHICH IGNITE PLAYER ARE YOU?", "Response Rate (%)": "100.0" },
        { "Screen Number": "S2", "Screen Name": "WHICH MATCHES YOUR STYLE", "Response Rate (%)": "88.9" },
        { "Screen Number": "S3", "Screen Name": "WHAT ARE YOUR GO-TO KICKS", "Response Rate (%)": "98.8" },
        { "Screen Number": "S4", "Screen Name": "WHAT IS YOUR PLAYING STYLE", "Response Rate (%)": "98.6" },
        { "Screen Number": "S5", "Screen Name": "WOULD YOU RATHER", "Response Rate (%)": "98.9" },
        { "Screen Number": "S6", "Screen Name": "WE HAVE YOUR RESULTS", "Response Rate (%)": "79.0" }
      ]
    };
  }
  
  // For queries about style preferences - table response
  if (query.toLowerCase().includes("style") || query.toLowerCase().includes("preference")) {
    return {
      message: "Here's the breakdown of style preferences from the NBA G League survey 👕. 'Laid back & low key' was the most popular choice at nearly 35%!",
      headers: ["Style Option", "Count", "Percentage (%)"],
      data: [
        { "Style Option": "Laid back & low key", "Count": "340", "Percentage (%)": "34.9" },
        { "Style Option": "Streetwear", "Count": "307", "Percentage (%)": "31.5" },
        { "Style Option": "Luxury designer", "Count": "95", "Percentage (%)": "9.8" },
        { "Style Option": "Cozy tech suit", "Count": "232", "Percentage (%)": "23.8" }
      ]
    };
  } 
  
  // For queries about sums or additions - text only response
  else if (query.toLowerCase().includes("sum") || query.toLowerCase().includes("add")) {
    return {
      message: "# Survey Completion Summary 🧮\n\n## Key Numbers\n\n• **Initial participants**: 1,096\n• **Final screen completions**: 742\n• **Overall completion rate**: 68%\n\nThe biggest drop-off occurs between the 5th and final screens, where we lose about 21% of the remaining participants."
    };
  } 
  
  // Default response - text only
  else {
    return {
      message: "# NBA G League Survey Overview 🏀\n\nHere are the key insights from your data:\n\n## Participation\n\n• **Total participants**: 1,096 across 6 screens\n• **Completion rate**: 68% (drops to 742 by final screen)\n\n## Style Preferences\n\n• **Most popular**: 'Laid back & low key' (34.9%)\n• **Runner-up**: 'Streetwear' (31.5%)\n• **Less common**: 'Luxury designer' (9.8%)"
    };
  }
}

// Function to generate sample responses for testing
function generateSampleResponse(query: string): { message: string, headers?: string[], data?: Record<string, string>[] } {
  // For queries about top products or comparisons - table response
  if (query.toLowerCase().includes("top") || query.toLowerCase().includes("compare")) {
    return {
      message: "Here's a comparison of the top products by sales 📊. Widget A is leading with $45,200 in sales and a healthy growth rate of 12.5%.",
      headers: ["Product", "Sales", "Growth", "Status"],
      data: [
        { "Product": "Widget A", "Sales": "$45,200", "Growth": "+12.5%", "Status": "Active" },
        { "Product": "Widget B", "Sales": "$32,100", "Growth": "+8.3%", "Status": "Active" },
        { "Product": "Widget C", "Sales": "$15,800", "Growth": "-2.1%", "Status": "Inactive" },
        { "Product": "Widget D", "Sales": "$12,400", "Growth": "+5.7%", "Status": "Active" }
      ]
    };
  } 
  
  // For queries about totals or sums - table response
  else if (query.toLowerCase().includes("total") || query.toLowerCase().includes("sum")) {
    return {
      message: "I've calculated the total sales by category 🔢. Electronics is your top performer with $78,500 in total sales.",
      headers: ["Category", "Total Sales", "Products", "Avg Growth"],
      data: [
        { "Category": "Electronics", "Total Sales": "$78,500", "Products": "5", "Avg Growth": "+7.2%" },
        { "Category": "Furniture", "Total Sales": "$45,200", "Products": "8", "Avg Growth": "+3.1%" },
        { "Category": "Clothing", "Total Sales": "$36,700", "Products": "12", "Avg Growth": "+1.5%" }
      ]
    };
  } 
  
  // Default response - text only
  else {
    return {
      message: "# Data Analysis Summary 📈\n\nHere are the key insights from your data:\n\n## Top Performers\n\n• **Leading product**: Widget A with $45,200 in sales and +12.5% growth\n• **Top category**: Electronics with $78,500 in total sales across 5 products\n\n## Notable Findings\n\n• Widget C shows negative growth (-2.1%) but still contributes significantly to overall sales\n• Electronics category has the highest average growth rate at +7.2%"
    };
  }
} 