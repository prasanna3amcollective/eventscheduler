import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PHOTOS_DIRECTORY } from '@/lib/constants';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params;
        const dir = decodeURIComponent(PHOTOS_DIRECTORY);
        const filePath = path.join(dir, filename);

        // Security check: ensure resolved path is within the photos directory
        const resolvedPath = path.resolve(filePath);
        const resolvedDir = path.resolve(dir);
        if (!resolvedPath.startsWith(resolvedDir)) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
        }

        if (!fs.existsSync(resolvedPath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.heic': 'image/heic',
            '.heif': 'image/heif',
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';
        const buffer = fs.readFileSync(resolvedPath);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Failed to serve photo:', error);
        return NextResponse.json({ error: 'Failed to serve photo' }, { status: 500 });
    }
}