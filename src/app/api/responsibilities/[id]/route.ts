import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { z } from 'zod';
import { responsibilitySchema } from '@/app/api/responsibilities/route'; // reuse schema from collection route

// GET a single responsibility by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const responsibility = await withAuth(securityContext, () => ({
      model: 'responsibility',
      operation: 'findUnique',
      args: {
        where: { id },
      },
    }));
    if (!responsibility) {
      return NextResponse.json({ error: 'Responsibility not found' }, { status: 404 });
    }
    return NextResponse.json(responsibility);
  } catch (error: any) {
    console.error('Error fetching responsibility:', error);
    if ((error as Error).message?.includes('Security Restricted')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH used for cancelling or updating state of a responsibility
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { detachReason, state, name, startDateTime, duration, category, owner } = await request.json();
    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data: any = {};
    if (detachReason !== undefined) data.detachReason = detachReason;
    if (state !== undefined) data.state = state;
    if (name !== undefined) data.name = name;
    if (startDateTime !== undefined) data.startDateTime = startDateTime;
    if (duration !== undefined) data.duration = Number(duration);
    if (category !== undefined) data.category = category;
    if (owner !== undefined) data.owner = owner;
    
    const updated = await withAuth(securityContext, () => ({
      model: 'responsibility',
      operation: 'update',
      args: {
        where: { id },
        data,
      },
    }));
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating responsibility:', error);
    if ((error as Error).message?.includes('Security Restricted')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Optional DELETE if needed in future
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await withAuth(securityContext, () => ({
      model: 'responsibility',
      operation: 'delete',
      args: { where: { id } },
    }));
    return NextResponse.json({ message: 'Responsibility deleted' });
  } catch (error: any) {
    console.error('Error deleting responsibility:', error);
    if ((error as Error).message?.includes('Security Restricted')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
