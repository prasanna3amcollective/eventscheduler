'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import './Gallery.css';

const VARIANTS = [
    'polaroid', 'dogear', 'torn', 'stamp', 'vintage', 'film',
    'instant', 'pinned', 'sticky', 'burnt', 'notebook', 'board',
] as const;
type Variant = (typeof VARIANTS)[number];

const SIZES = ['sm', 'md', 'lg', 'xl'] as const;
type Size = (typeof SIZES)[number];

function hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}

function variantForFilename(filename: string): Variant {
    return VARIANTS[hashStr(filename) % VARIANTS.length];
}

function sizeForFilename(filename: string): Size {
    return SIZES[hashStr(filename + '_s') % SIZES.length];
}

function rotationForFilename(filename: string): number {
    return ((hashStr(filename + '_r') % 70) - 25) / 10; // -2.5 to +4.4
}

const PHOTOS_PER_ROW = 6;

function buildRows(photos: string[]) {
    const rows: { filename: string; variant: Variant; size: Size; rotation: number }[][] = [];
    photos.forEach((filename, index) => {
        const rowIndex = Math.floor(index / PHOTOS_PER_ROW);
        if (!rows[rowIndex]) rows[rowIndex] = [];
        rows[rowIndex].push({
            filename,
            variant: variantForFilename(filename),
            size: sizeForFilename(filename),
            rotation: rotationForFilename(filename),
        });
    });
    return rows;
}

export default function Gallery() {
    const [photos, setPhotos] = useState<string[]>([]);
    const [metadata, setMetadata] = useState<Record<string, string>>({});
    const [canEdit, setCanEdit] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [editDesc, setEditDesc] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const res = await fetch('/api/photos');
                if (!res.ok) throw new Error('Failed to load photos');
                const data = await res.json();
                setPhotos(data.photos || []);
                setMetadata(data.metadata || {});
                setCanEdit(data.canEdit || false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load photos');
            } finally {
                setLoading(false);
            }
        };
        fetchPhotos();
    }, []);

    const openLightbox = useCallback((filename: string) => {
        setSelectedPhoto(filename);
        setEditDesc(metadata[filename] || '');
    }, [metadata]);

    const closeLightbox = useCallback(() => {
        setSelectedPhoto(null);
        setEditDesc('');
    }, []);

    useEffect(() => {
        if (!selectedPhoto) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeLightbox();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPhoto, closeLightbox]);

    useEffect(() => {
        document.body.style.overflow = selectedPhoto ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [selectedPhoto]);

    const saveDescription = async () => {
        if (!selectedPhoto) return;
        setSaving(true);
        try {
            const res = await fetch('/api/photos/description', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: selectedPhoto, description: editDesc }),
            });
            if (!res.ok) throw new Error('Failed to save');
            setMetadata(prev => ({ ...prev, [selectedPhoto]: editDesc }));
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const rows = useMemo(() => buildRows(photos), [photos]);

    if (loading) {
        return (
            <div className="gallery-container">
                <h2 className="gallery-title">Gallery</h2>
                <p className="gallery-subtitle">Loading photos...</p>
                <div className="gallery-loading">
                    <div className="spinner" style={{ width: 36, height: 36, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="gallery-container">
                <h2 className="gallery-title">Gallery</h2>
                <p className="gallery-subtitle">Explore photos from past activities.</p>
                <div className="gallery-error">{error}</div>
            </div>
        );
    }

    if (photos.length === 0) {
        return (
            <div className="gallery-container">
                {/* <h2 className="gallery-title">Gallery</h2>
                <p className="gallery-subtitle">Explore photos from past activities.</p> */}
                <div className="gallery-error">No photos found.</div>
            </div>
        );
    }

    const currentDesc = selectedPhoto ? metadata[selectedPhoto] : '';

    return (
        <div className="gallery-container">
            {/* <h2 className="gallery-title">Gallery</h2>
            <p className="gallery-subtitle">Explore photos from past activities.</p> */}

            <div className="gallery-wall">
                {rows.map((row, rowIndex) => (
                    <div key={`row-${rowIndex}`} className="gallery-row">
                        <svg className="gallery-row-string" preserveAspectRatio="none">
                            <path
                                d={`M 15 25 Q ${row.length > 1 ? 25 : 15} 45, ${row.length > 1 ? 35 : 15} 25`}
                                fill="none" stroke="#666" strokeWidth="1.5" opacity="0.4"
                            />
                        </svg>
                        {row.map((item) => (
                            <div
                                key={item.filename}
                                className={`photo-card photo-card-variant-${item.variant} photo-card-size-${item.size}`}
                                style={{ '--rotation': `${item.rotation}deg` } as any}
                                onClick={() => openLightbox(item.filename)}
                                role="button" tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(item.filename); }
                                }}
                            >
                                <img src={`/api/photos/${encodeURIComponent(item.filename)}`} alt={item.filename} loading="lazy" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {selectedPhoto && (
                <div className="gallery-lightbox-overlay" onClick={closeLightbox}>
                    <div className="gallery-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="gallery-lightbox-close" onClick={closeLightbox} aria-label="Close">×</button>
                        <div className="gallery-lightbox-polaroid">
                            <img src={`/api/photos/${encodeURIComponent(selectedPhoto)}`} alt={selectedPhoto} />
                            {/* Description area */}
                            <div className="gallery-lightbox-desc-area">
                                {canEdit ? (
                                    <div className="gallery-desc-edit">
                                        <textarea
                                            className="gallery-desc-textarea"
                                            value={editDesc}
                                            onChange={(e) => setEditDesc(e.target.value)}
                                            placeholder="Write a description..."
                                            rows={3}
                                        />
                                        <div className="gallery-desc-actions">
                                            <button
                                                className="gallery-desc-save-btn"
                                                onClick={saveDescription}
                                                disabled={saving}
                                            >
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    currentDesc ? (
                                        <p className="gallery-desc-text">{currentDesc}</p>
                                    ) : null
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}