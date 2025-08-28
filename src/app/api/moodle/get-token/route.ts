import { NextResponse } from 'next/server';

export async function GET() {
  const moodleToken = process.env.MOODLE_WEBSERVICE_TOKEN;
  
  if (moodleToken) {
    return NextResponse.json({ token: moodleToken }, { status: 200 });
  } else {
    return NextResponse.json(
      { message: 'MOODLE_WEBSERVICE_TOKEN no está configurado en el servidor.' }, 
      { status: 500 }
    );
  }
} 