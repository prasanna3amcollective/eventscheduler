import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { addMinutes, startOfDay as startOfDayFn } from 'date-fns';
import { activitySchema } from '@/lib/validations';
import { z } from 'zod';
import { generateOccurrenceDates } from '@/lib/recurrence';
import { isShadowGeneratedRow, ensureShadowTemplateAndMaterialize } from '@/lib/recurrence/shadow';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get('start') || startOfDayFn(new Date()).toISOString();
  const endParam = searchParams.get('end') || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const rangeStart = new Date(startParam);
  const rangeEnd = new Date(endParam);

  try {
    const securityContext = await getSessionContext();

    const dbActivities: any[] = await (withAuth(securityContext, () => ({
      model: 'activity',
      operation: 'findMany',
      args: {
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      }
    })) as any);

    // PHASE 5 shadow filter — remove materialized shadow rows so UI never sees them.
    // Backlinked masters (which still carry recurrenceRule) continue to drive virtual expansion.
    // This filter (and the loosened isTemplateMaster predicate below) are the ONLY changes
    // to the read path during shadow mode. They will be deleted at cutover.
    // Do not remove until PHASE 8 cutover.
    const visibleDbActivities = dbActivities.filter((a: any) => !isShadowGeneratedRow(a));

    const expandedActivities: any[] = [];

    // Hybrid recurrence support: collect slots that have explicit detached/stored instances
    // so we can suppress the corresponding synthetic occurrence from the master template.
    const overriddenSlots = new Set<string>();
    for (const act of visibleDbActivities) {
      if (act.recurrenceTemplateId && act.detachReason && act.detachReason !== 'none') {
        const startIso = new Date(act.startDateTime).toISOString();
        overriddenSlots.add(`${act.recurrenceTemplateId}:${startIso}`);
      }
    }

    for (const activity of visibleDbActivities) {
      // Extract staff members from participants based on their type
      const leaders = activity.participants.filter((p: any) => p.type === 'Leader').map((p: any) => p.user?.name).filter(Boolean);
      const guides = activity.participants.filter((p: any) => p.type === 'Guide').map((p: any) => p.user?.name).filter(Boolean);
      const observers = activity.participants.filter((p: any) => p.type === 'Observer').map((p: any) => p.user?.name).filter(Boolean);

      const staffNames = [...leaders, ...guides, ...observers];
      const participantUserNames = new Set<string>();

      for (const p of activity.participants) {
        if (p.user) {
          participantUserNames.add(p.user.name);
        }
      }

      // Add staff names to participant names set (just for count calculation)
      for (const name of staffNames) {
        if (name) participantUserNames.add(name);
      }

      // Calculate total unique participants
      const totalCount = participantUserNames.size;

      // PHASE 5: loosened master detection — a row with recurrenceRule is still treated
      // as an expansion master even after it has been backlinked to a RecurrenceTemplate.
      // This keeps virtual expansion alive for the original master during shadow validation.
      // The `|| Boolean(activity.recurrenceRule)` guard is required post-backlink and will
      // be removed only at cutover when rrule is stripped from masters.
      const isTemplateMaster = !activity.recurrenceTemplateId || Boolean(activity.recurrenceRule);

      if (isTemplateMaster && activity.isRecurring && activity.recurrenceRule) {
        const occurrences = generateOccurrenceDates(activity.recurrenceRule, rangeStart, rangeEnd);
        for (const date of occurrences) {
          const key = `${activity.id}:${date.toISOString()}`;
          if (overriddenSlots.has(key)) {
            // Hybrid transition: a stored detached row (edited/cancelled/...) exists for this slot.
            // Skip synthetic so the real persisted row (with correct detachReason and real id) is the only one.
            continue;
          }
          expandedActivities.push({
            ...activity,
            id: `${activity.id}_inst_${date.getTime()}`,
            originalId: activity.id,
            startDateTime: date,
            endDateTime: addMinutes(date, activity.duration),
            participantCount: totalCount,
            leaders,
            guides,
            observers,
            // ensure lineage defaults are present on virtuals too
            recurrenceTemplateId: activity.recurrenceTemplateId ?? activity.id,
            generatedFromTemplateId: activity.id,
            detachReason: 'none'
          });
        }
      } else {
        if (activity.endDateTime >= rangeStart && activity.startDateTime <= rangeEnd) {
          expandedActivities.push({
            ...activity,
            participantCount: totalCount,
            leaders,
            guides,
            observers
          });
        }
      }
    }

    return NextResponse.json(expandedActivities);
  } catch (error: any) {
    console.error("Error fetching activities:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
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
    const { name, leader, guide, observer, startDateTime, endDateTime, duration, isRecurring, recurrenceRule, category, recurrenceTemplateId, generatedFromTemplateId, detachReason } = parsedData;

    const securityContext = await getSessionContext();

    const activity = await withAuth(securityContext, () => ({
      model: 'activity',
      operation: 'create',
      args: {
        data: {
          name,
          startDateTime: new Date(startDateTime),
          endDateTime: new Date(endDateTime),
          duration: Number(duration),
          isRecurring: Boolean(isRecurring),
          recurrenceRule: isRecurring ? recurrenceRule : null,
          recurrenceTemplateId: recurrenceTemplateId || null,
          generatedFromTemplateId: generatedFromTemplateId || null,
          detachReason: detachReason || 'none',
          category: category || 'General',
        }
      }
    }));

    // Create staff participants (leader/guide/observer)
    const staffRoles = [
      { names: leader, type: 'Leader' },
      { names: guide, type: 'Guide' },
      { names: observer, type: 'Observer' }
    ];

    for (const role of staffRoles) {
      for (const name of role.names) {
        const user = await prisma.user.findFirst({
          where: { name: name }
        });
        if (user) {
          await prisma.participant.create({
            data: {
              activityId: activity.id,
              userId: user.id,
              type: role.type
            }
          }).catch((err: any) => {
            if (err.code === 'P2002') {
              // User already has a participant record for this activity — skip
              return;
            }
            throw err;
          });
        }
      }
    }

    // PHASE 5 — shadow generation for newly created recurring masters (best-effort only).
    // After the legacy master exists we create the RecurrenceTemplate + materialized
    // children (no rrule on them) and back-link the master. The UI never sees the
    // shadows because of the filter added in GET. The master keeps its recurrenceRule
    // for the duration of this phase so virtual expansion is unaffected.
    // This block is deliberately after the HTTP-relevant work and is wrapped inside
    // the helper's own try/catch.
    if (isRecurring && recurrenceRule && !recurrenceTemplateId) {
      const tplId = await ensureShadowTemplateAndMaterialize({
        prisma,
        masterId: activity.id,
        model: 'activity',
        templateType: 'activity',
        name,
        duration: Number(duration),
        category: category || 'General',
        recurrenceRule,
        startDateTime: new Date(startDateTime),
        context: securityContext,
      });
      if (tplId) {
        // Patch so the 201 response body already shows the backlinks (harmless; UI ignores them for now)
        (activity as any).recurrenceTemplateId = tplId;
        (activity as any).generatedFromTemplateId = tplId;
      }
    }

    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    console.error("Error creating activity FULL ERROR:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message, details: error.issues }, { status: 400 });
    }
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error', message: error.message, stack: error.stack }, { status: 500 });
  }
}
