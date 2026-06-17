'use client';

import React, { useState, useRef, useEffect } from 'react';
import './Testimonials.css';

function stripHtml(html: string): string {
    if (typeof window === 'undefined') return html;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
}

export default function Testimonials({ onBackClick }: { onBackClick?: () => void }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [testimonialText, setTestimonialText] = useState('');
    const [authorName, setAuthorName] = useState('');
    const editorRef = useRef<HTMLDivElement>(null);
    // Track when modal opened for bot check
    const [modalOpenTime, setModalOpenTime] = useState<number | null>(null);
    // State for error message when submitting too quickly
    const [submitError, setSubmitError] = useState('');

    const handleOpenModal = () => {
        setIsModalOpen(true);
        setModalOpenTime(Date.now());
        setSubmitError('');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTestimonialText('');
        setAuthorName('');
        setSelectedTestimonial(null);
    };

    const handleSubmit = async () => {
        if (!testimonialText.trim()) return;
        if (modalOpenTime && Date.now() - modalOpenTime < 5000) {
            setSubmitError('Please take at least 5 seconds before submitting.');
            return;
        }
        try {
            await fetch('/api/testimonials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: testimonialText, name: authorName || null })
            });
            // Refresh list after submission
            setCurrentPage(1);
            fetchTestimonials(1);
        } catch (e) {
            console.error('Failed to submit testimonial', e);
        }
        handleCloseModal();
    };

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    // Pagination and testimonial list state
    const [testimonials, setTestimonials] = useState<Array<{ id: string; description: string; name?: string }>>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    const fetchTestimonials = async (page: number) => {
        try {
            const res = await fetch(`/api/testimonials?page=${page}&limit=${pageSize}`);
            const data = await res.json();
            setTestimonials(data.testimonials);
            setTotalCount(data.totalCount);
        } catch (e) {
            console.error('Failed to fetch testimonials', e);
        }
    };

    useEffect(() => {
        fetchTestimonials(currentPage);
    }, [currentPage]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const [selectedTestimonial, setSelectedTestimonial] = useState<{ id: string; description: string; name?: string } | null>(null);


    return (
        <div className="testimonials-page">
            <div className="testimonials-container">
                <div className="testimonials-header">
                    <h1>TESTIMONIALS.</h1>
                    <p>Share your experience with the collective.</p>
                </div>

                <div className="testimonials-input-area">
                    <div
                        className="testimonials-input-box"
                        onClick={handleOpenModal}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                handleOpenModal();
                            }
                        }}
                    >
                        <span className="testimonials-input-placeholder">
                            + Add your testimonial
                        </span>
                    </div>
                </div>

                {/* Testimonials list */}
                <div className="testimonials-list">
                    {testimonials.map((t) => {
                        const plainText = stripHtml(t.description);
                        const previewText = plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
                        return (
                            <div
                                key={t.id}
                                className="testimonial-card"
                                onClick={() => setSelectedTestimonial(t)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        setSelectedTestimonial(t);
                                    }
                                }}
                            >
                                <p className="testimonial-card-name">{t.name || 'Anonymous'}</p>
                                <p className="testimonial-card-preview">{previewText}</p>
                            </div>
                        );
                    })}
                </div>
                {/* Pagination controls */}
                {totalPages > 1 && (
                    <div className="testimonials-pagination">
                        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="testimonials-page-btn">Prev</button>
                        <span className="testimonials-page-info">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="testimonials-page-btn">Next</button>
                    </div>
                )}
            </div>

            {/* Testimonial Editor Modal */}
            {isModalOpen && (
                <div className="testimonials-modal-overlay" onClick={handleCloseModal}>
                    <div
                        className="testimonials-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="testimonials-modal-header">
                            <h2>WRITE YOUR TESTIMONIAL</h2>
                            <button
                                className="testimonials-modal-close"
                                onClick={handleCloseModal}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="testimonials-modal-body">
                            <div className="testimonials-editor-toolbar">
                                <button
                                    type="button"
                                    onClick={() => execCommand('bold')}
                                    className="testimonials-toolbar-btn"
                                    title="Bold"
                                >
                                    B
                                </button>
                                <button
                                    type="button"
                                    onClick={() => execCommand('italic')}
                                    className="testimonials-toolbar-btn"
                                    title="Italic"
                                >
                                    I
                                </button>
                                <button
                                    type="button"
                                    onClick={() => execCommand('underline')}
                                    className="testimonials-toolbar-btn"
                                    title="Underline"
                                >
                                    U
                                </button>
                                <div className="testimonials-toolbar-divider" />
                                <button
                                    type="button"
                                    onClick={() => execCommand('insertUnorderedList')}
                                    className="testimonials-toolbar-btn"
                                    title="Bullet List"
                                >
                                    &#8226;
                                </button>
                                <button
                                    type="button"
                                    onClick={() => execCommand('insertOrderedList')}
                                    className="testimonials-toolbar-btn"
                                    title="Numbered List"
                                >
                                    1.
                                </button>
                            </div>

                            <div
                                ref={editorRef}
                                className="testimonials-editor"
                                contentEditable
                                data-placeholder="Write your testimonial here..."
                                onInput={(e) => {
                                    setTestimonialText((e.target as HTMLDivElement).innerHTML);
                                }}
                            />

                            <div className="testimonials-name-field">
                                <label htmlFor="author-name">NAME (OPTIONAL)</label>
                                <input
                                    id="author-name"
                                    type="text"
                                    className="neo-input"
                                    placeholder="Your name"
                                    value={authorName}
                                    onChange={(e) => setAuthorName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="testimonials-modal-footer">
                            <button
                                type="button"
                                className="testimonials-cancel-btn"
                                onClick={handleCloseModal}
                            >
                                CANCEL
                            </button>
                            <button
                                type="button"
                                className="testimonials-submit-btn"
                                onClick={handleSubmit}
                                disabled={!testimonialText.trim() || (modalOpenTime !== null && Date.now() - modalOpenTime < 5000)}
                            >
                                SUBMIT
                            </button>
                            {submitError && <div className="testimonials-error" style={{ color: 'red', marginTop: '8px' }}>{submitError}</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Full testimonial modal */}
            {selectedTestimonial && (
                <div className="testimonials-modal-overlay" onClick={() => setSelectedTestimonial(null)}>
                    <div className="testimonials-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="testimonials-modal-header">
                            <h2>{selectedTestimonial.name || 'Anonymous'} Said:</h2>
                            <button className="testimonials-modal-close" onClick={() => setSelectedTestimonial(null)}>×</button>
                        </div>
                        <div className="testimonials-modal-body">
                            <div dangerouslySetInnerHTML={{ __html: selectedTestimonial.description }} />
                        </div>
                        {/* <div className="testimonials-modal-footer">
                            <button className="testimonials-cancel-btn" onClick={() => setSelectedTestimonial(null)}>Close</button>
                        </div> */}
                    </div>
                </div>
            )}
        </div>
    );
}