import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { z } from 'zod';

const responsibilitySchema = z.object({
  name: z.string().min(1, 'Responsibility name is required').max(200),
  startDateTime: z.string().datetime({ message: "Invalid start date format" }),
  endDateTime: z.string().datetime({ message: "Invalid end date format" }),
  duration: z.number().positive(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().nullable().optional(),
  category: z.string().default('General'),
  state: z.enum(['Scheduled', 'Completed']).default('Scheduled').optional(),
  owner: z.string().optional().nullable()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedData = responsibilitySchema.parse(body);
    const { name, startDateTime, endDateTime, duration, isRecurring, recurrenceRule, category, owner } = parsedData;

    const securityContext = await getSessionContext();

    const responsibility = await withAuth(securityContext, () => ({
      model: 'responsibility',
      operation: 'create',
      args: {
        data: {
          name,
          startDateTime: new Date(startDateTime),
          endDateTime: new Date(endDateTime),
          duration: Number(duration),
          isRecurring: Boolean(isRecurring),
          recurrenceRule: isRecurring ? recurrenceRule : null,
          category: category || 'General',
          owner: owner || null,
        }
      }
    }));

    return NextResponse.json(responsibility, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating responsibility:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const securityContext = await getSessionContext();

    const responsibilities = await withAuth(securityContext, () => ({
      model: 'responsibility',
      operation: 'findMany',
      args: {
        orderBy: { startDateTime: 'asc' }
      }
    }));

    return NextResponse.json(responsibilities);
  } catch (error: unknown) {
    console.error("Error fetching responsibilities:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
