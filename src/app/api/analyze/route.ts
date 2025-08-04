import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    // Try both environment variable names
    const ANTHROPIC_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    
    console.log('API key check:', {
      hasPublicKey: !!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      hasPrivateKey: !!process.env.ANTHROPIC_API_KEY,
      finalKey: !!ANTHROPIC_API_KEY
    });
    
    if (!ANTHROPIC_API_KEY) {
      console.error('Missing API key in environment variables');
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 8192,
        messages: [
          { 
            role: "user", 
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: `API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}