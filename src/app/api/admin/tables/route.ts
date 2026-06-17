import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/auth';
import { Prisma } from '@/generated/prisma/client';

export async function GET() {
  try {
    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tables = Object.values(Prisma.ModelName).map((name) => name.toLowerCase());
    
    return NextResponse.json(tables);
  } catch (error: any) {
    console.error("Error fetching tables:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
