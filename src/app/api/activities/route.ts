import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { startOfDay as startOfDayFn } from 'date-fns';
import { activitySchema } from '@/lib/validations';
import { z } from 'zod';
import { materializeTemplateWindow } from '@/lib/recurrence/generator';
import { randomUUID } from 'crypto';
import type { Activity } from '@/generated/prisma/client';
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get('start') || startOfDayFn(new Date()).toISOString();
  const endParam = searchParams.get('end') || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const rangeStart = new Date(startParam);
  const rangeEnd = new Date(endParam);

  try {
    const securityContext = await getSessionContext();
    console.log(`[ACT GET] securityContext id=${securityContext?.id} roles=[${securityContext?.roles?.join(',') || 'none'}]`);

    // PHASE 6: Real occurrence APIs — return only persisted rows (no virtual expansion, no _inst_ ids).
    // Date range pushed into Prisma for efficiency with many concrete occurrences.
    const dbActivities: any[] = await (withAuth(securityContext, () => ({
      model: 'activity',
      operation: 'findMany',
      args: {
        where: {
          startDateTime: { lte: rangeEnd },
          endDateTime: { gte: rangeStart },
          detachReason: { not: 'cancelled' },
          state: { not: 'Cancelled' }
        },
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      }
    })) as any);

    const enrichedActivities: any[] = dbActivities.map((activity: any) => {
      const leaders = activity.participants.filter((p: any) => p.type === 'Leader').map((p: any) => p.user?.name).filter(Boolean);
      const guides = activity.participants.filter((p: any) => p.type === 'Guide').map((p: any) => p.user?.name).filter(Boolean);
      const observers = activity.participants.filter((p: any) => p.type === 'Observer').map((p: any) => p.user?.name).filter(Boolean);

      const participantUserNames = new Set<string>();
      for (const p of activity.participants) {
        if (p.user) participantUserNames.add(p.user.name);
      }
      for (const name of [...leaders, ...guides, ...observers]) {
        if (name) participantUserNames.add(name);
      }

      return {
        ...activity,
        participantCount: participantUserNames.size,
        leaders,
        guides,
        observers
      };
    });

    return NextResponse.json(enrichedActivities);
  } catch (error: any) {
    console.error("Error fetching activities:", error);
    if ((error as Error).message?.includes('Security Restricted')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("POST /api/activities body:", JSON.stringify(body, null, 2));
    const parsedData = activitySchema.parse(body);
    console.log("POST /api/activities parsedData:", JSON.stringify(parsedData, null, 2));
    const { name, description, leader, guide, observer, startDateTime, endDateTime, duration, isRecurring, recurrenceRule, recurrenceStart, recurrenceUntil, category, recurrenceTemplateId, generatedFromTemplateId, detachReason, recurrenceWeeks } = parsedData;

    const securityContext = await getSessionContext();
    // removed duplicate destructuring (already handled above)
    // PHASE 6: new recurring series — always create via RecurrenceTemplate + materialize real children.
    // Staff attached to children. No legacy master row with recurrenceRule is ever created.
    if (isRecurring && recurrenceRule && !recurrenceTemplateId) {
      try {
        const tpl = await prisma.recurrenceTemplate.create({
          data: {
            templateType: 'activity',
            name,
            duration: Number(duration),
            category: category || 'General',
            recurrenceRule,
            // startDate / endDate on the template now come from the dedicated Recurrence Start/Until fields when supplied (they also drive DTSTART/UNTIL inside recurrenceRule)
            startDate: recurrenceStart ? new Date(recurrenceStart) : new Date(startDateTime),
            endDate: recurrenceUntil ? new Date(recurrenceUntil) : null,
            versionSeriesId: randomUUID(),
            version: 1,
            status: 'active',
          },
          ...(securityContext ? { _context: securityContext } : {}),
        });

        // Use a fixed horizon of 45 days for materialization, matching the cron job
        await materializeTemplateWindow(prisma, tpl.id, {
          asOf: recurrenceStart ? new Date(recurrenceStart) : new Date(startDateTime),
          horizonDays: 45,
          context: securityContext,
        });

        // Attach staff to every materialized child
        const staffRoles = [
          { names: leader, type: 'Leader' },
          { names: guide, type: 'Guide' },
          { names: observer, type: 'Observer' }
        ];
        const children: any[] = await prisma.activity.findMany({
          where: {
            recurrenceTemplateId: tpl.id,
            startDateTime: { gte: new Date(startDateTime) }
          },
          select: { id: true }
        });
        for (const child of children) {
          for (const role of staffRoles) {
            for (const n of role.names) {
              const user = await prisma.user.findFirst({ where: { name: n } });
              if (user) {
                await prisma.participant.create({
                  data: { activityId: child.id, userId: user.id, type: role.type }
                }).catch((err: any) => {
                  if (err.code === 'P2002') return;
                  throw err;
                });
              }
            }
          }
        }

        const firstChild = children[0];
        return NextResponse.json({
          id: firstChild ? firstChild.id : tpl.id,
          name,
          startDateTime,
          endDateTime: endDateTime,
          duration: Number(duration),
          isRecurring: true,
          recurrenceRule: null,
          recurrenceTemplateId: tpl.id,
          generatedFromTemplateId: tpl.id,
          detachReason: 'none',
          category: category || 'General'
        }, { status: 201 });
      } catch (recurringErr) {
        console.error("Recurring activity create failed (FULL):", recurringErr);
        throw recurringErr; // let the outer catch turn it into 500 with details
      }
    }

    // Non-recurring or explicit child of existing template
    const activity = await withAuth(securityContext, () => ({
      model: 'activity',
      operation: 'create',
      args: {
        data: {
          name,
          description,
          startDateTime: new Date(startDateTime),
          endDateTime: new Date(endDateTime),
          duration: Number(duration),
          isRecurring: Boolean(isRecurring),
          recurrenceRule: isRecurring ? recurrenceRule : null,
          recurrenceTemplateId: recurrenceTemplateId || null,
          generatedFromTemplateId: generatedFromTemplateId || null,
          detachReason: detachReason || 'none',
          category: category || 'General',
        },
      },
    })) as unknown as Activity;


    // Create staff participants
    const staffRoles = [
      { names: leader, type: 'Leader' },
      { names: guide, type: 'Guide' },
      { names: observer, type: 'Observer' }
    ];

    for (const role of staffRoles) {
      for (const name of role.names) {
        const user = await prisma.user.findFirst({
          where: { name }
        });
        if (user) {
          await prisma.participant.create({
            data: {
              activityId: activity.id,
              userId: user.id,
              type: role.type,
            },
          }).catch((err: any) => {
            if (err.code === 'P2002') {
              return;
            }
            throw err;
          });
        }
      }
    }


    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    console.error("Error creating activity FULL ERROR:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message, details: error.issues }, { status: 400 });
    }
    if ((error as Error).message?.includes('Security Restricted')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error', message: (error as Error).message, stack: error.stack }, { status: 500 });
  }
}
