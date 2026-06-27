import { NextResponse } from 'next/server';
import fs from 'fs';
import { PHOTOS_DIRECTORY } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function GET() {
    try {
        const dir = decodeURIComponent(PHOTOS_DIRECTORY);
        if (!fs.existsSync(dir)) {
            return NextResponse.json({ error: 'Photos directory not found' }, { status: 404 });
        }

        const files = fs.readdirSync(dir)
            .filter((f: string) => /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(f))
            .sort();

        // Fetch descriptions from DB — auto-create records for new files
        const descriptions = new Map<string, string>();
        const existing = await prisma.photo.findMany({
            where: { filename: { in: files } },
        });
        existing.forEach((p: { filename: string; description: string | null }) => {
            if (p.description) descriptions.set(p.filename, p.description);
        });

        // Auto-create Photo records for files that don't have one yet
        const existingFilenames = new Set(existing.map((p: { filename: string }) => p.filename));
        const newFiles = files.filter((f: string) => !existingFilenames.has(f));
        if (newFiles.length > 0) {
            await prisma.photo.createMany({
                data: newFiles.map((f: string) => ({ filename: f })),
                skipDuplicates: true,
            });
        }

        // Check if current user can edit photo metadata
        let canEdit = false;
        try {
            const session = await getSessionContext();
            if (session) {
                const acls = await prisma.accessControlList.findMany({
                    where: { table: 'photo', operation: 'write' },
                });
                if (acls.length === 0) {
                    canEdit = true; // no ACLs set = allow
                } else {
                    canEdit = acls.some((acl: any) => session.roles.includes(acl.roleId));
                }
            }
        } catch { /* not logged in */ }

        return NextResponse.json({
            photos: files,
            metadata: Object.fromEntries(descriptions),
            canEdit,
        });
    } catch (error) {
        console.error('Failed to list photos:', error);
        return NextResponse.json({ error: 'Failed to list photos' }, { status: 500 });
    }
}