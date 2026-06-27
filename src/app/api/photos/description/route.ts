import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function PUT(request: Request) {
    try {
        const session = await getSessionContext();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { filename, description } = await request.json();
        if (!filename || typeof filename !== 'string') {
            return NextResponse.json({ error: 'filename is required' }, { status: 400 });
        }

        // Check ACL for photo write
        const acls = await prisma.accessControlList.findMany({
            where: { table: 'photo', operation: 'write' },
        });
        if (acls.length > 0) {
            const hasAccess = acls.some((acl: any) => session.roles.includes(acl.roleId));
            if (!hasAccess) {
                return NextResponse.json({ error: 'Security Restricted: insufficient permissions' }, { status: 403 });
            }
        }

        // Upsert the photo description
        const photo = await prisma.photo.upsert({
            where: { filename },
            update: { description: description || null },
            create: { filename, description: description || null },
        });

        return NextResponse.json({ success: true, filename: photo.filename, description: photo.description });
    } catch (error) {
        console.error('Failed to update photo description:', error);
        return NextResponse.json({ error: 'Failed to update description' }, { status: 500 });
    }
}