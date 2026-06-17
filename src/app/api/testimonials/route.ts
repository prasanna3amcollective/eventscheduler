import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);
  const limit = Math.max(parseInt(url.searchParams.get('limit') || '6'), 1);
  const skip = (page - 1) * limit;

  const [testimonials, totalCount] = await Promise.all([
    prisma.testimonial.findMany({
      skip,
      take: limit,
      orderBy: { sys_created_at: 'desc' },
      select: { id: true, description: true, name: true },
    }),
    prisma.testimonial.count(),
  ]);

  return NextResponse.json({ testimonials, totalCount });
}

export async function POST(request: Request) {
  try {
    const { description, name } = await request.json();
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Invalid description' }, { status: 400 });
    }
    const newTestimonial = await prisma.testimonial.create({
      data: { description, name: name ?? undefined },
      select: { id: true, description: true, name: true },
    });
    return NextResponse.json(newTestimonial, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}
