'use client';

import React, { useState, useEffect, useCallback } from 'react';
import EventForm from './EventForm';
import EventActivityForm from './EventActivityForm';
import EventResponsibilityForm from './EventResponsibilityForm';
import EventDetailModal from './EventDetailModal';
import AnnouncementForm from './AnnouncementForm';
import AnnouncementModal from './AnnouncementModal';
import Gallery from './Gallery';
import { CalendarDays, Plus, User, Layers, Check, Target } from './Icons';

interface LoomSectionProps {
  currentUser: any;
}

export default function LoomSection({ currentUser }: LoomSectionProps) {
  const [activeTab, setActiveTab] = useState<'happenings' | 'gallery'>('happenings');
  const [currentPage, setCurrentPage] = useState(1);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Form triggers
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [showCreateAnnouncementForm, setShowCreateAnnouncementForm] = useState(false);
  const [selectedEventForActivity, setSelectedEventForActivity] = useState<any | null>(null);
  const [selectedEventForResponsibility, setSelectedEventForResponsibility] = useState<any | null>(null);
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<any | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);

  const fetchEventsAndAnnouncements = useCallback(async () => {
    setLoadingEvents(true);
    setError(null);
    try {
      const [eventsRes, announcementsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/announcements')
      ]);
      if (!eventsRes.ok || !announcementsRes.ok) {
        throw new Error('Failed to fetch community happenings');
      }
      const eventsData = await eventsRes.json();
      const announcementsData = await announcementsRes.json();
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not load happenings');
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchEventsAndAnnouncements();
  }, [fetchEventsAndAnnouncements]);

  const showNotice = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const itemsPerPage = 9;
  const combinedItems = [
    ...announcements.map(a => ({ type: 'announcement', data: a })),
    ...events.map(e => ({ type: 'event', data: e }))
  ];
  const totalPages = Math.ceil(combinedItems.length / itemsPerPage);
  const currentItems = combinedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="loom-section fade-in" style={{ padding: '32px 16px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Banner / Header */}
      <div
        style={{
          background: 'var(--bg-color)',
          border: '3px solid var(--border-color)',
          boxShadow: '6px 6px 0px 0px #000000',
          padding: '32px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontFamily: 'var(--heading-font)', fontSize: '32px', fontWeight: 'bold', margin: '0 0 12px 0', color: 'var(--primary-color)' }}>
            The Loom
          </h1>
          <p style={{ fontFamily: 'var(--body-font)', fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '780px', lineHeight: 1.6, margin: 0 }}>
            Around the Loom, we co-create community gatherings and share caretaking horizontally—without hierarchy or top-down ownership.
            Every thread—whether a community event, an activity within an event, a mutual responsibility, or a photo story—is woven by all of us together.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('happenings')}
          className={activeTab === 'happenings' ? 'yellow-btn' : 'btn-outline'}
          style={{ fontSize: '15px', padding: '10px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <CalendarDays size={18} /> Events and Announcements
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gallery')}
          className={activeTab === 'gallery' ? 'yellow-btn' : 'btn-outline'}
          style={{ fontSize: '15px', padding: '10px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          Gallery
        </button>
      </div>

      {successMsg && (
        <div style={{ background: 'var(--primary-color)', color: '#000', padding: '12px 20px', border: '3px solid #000', boxShadow: '4px 4px 0px 0px #000', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={18} /> {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(255, 68, 68, 0.15)', color: '#ff4444', padding: '14px 20px', border: '2px solid #ff4444', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* TAB CONTENT 1: HAPPENINGS */}
      {activeTab === 'happenings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ fontFamily: 'var(--heading-font)', fontSize: '24px', margin: 0, color: 'var(--text-primary)' }}>
              Community Events & Happenings
            </h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="yellow-btn"
                onClick={() => setShowCreateEventForm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Plus size={18} /> Co-Create New Event
              </button>
              <button
                type="button"
                className="pink-btn"
                onClick={() => setShowCreateAnnouncementForm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Target size={18} /> New Announcement
              </button>
            </div>
          </div>

          {/* Create Event Modal */}
          {showCreateEventForm && (
            <div
              className="modal-overlay"
              onClick={(e) => { if (e.target === e.currentTarget) setShowCreateEventForm(false); }}
              style={{ zIndex: 1000 }}
            >
              <div className="modal-content" style={{ maxWidth: '600px', padding: '28px', background: 'var(--bg-color)', border: '3px solid var(--border-color)', boxShadow: '8px 8px 0px 0px #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontFamily: 'var(--heading-font)', color: 'var(--primary-color)', fontSize: '20px' }}>
                    Co-Create Event
                  </h3>
                  <button type="button" onClick={() => setShowCreateEventForm(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>
                <EventForm
                  onSuccess={() => {
                    setShowCreateEventForm(false);
                    fetchEventsAndAnnouncements();
                    showNotice('New event successfully woven into the Loom!');
                  }}
                  onCancel={() => setShowCreateEventForm(false)}
                />
              </div>
            </div>
          )}

          {/* Create Announcement Modal */}
          {showCreateAnnouncementForm && (
            <div
              className="modal-overlay"
              onClick={(e) => { if (e.target === e.currentTarget) setShowCreateAnnouncementForm(false); }}
              style={{ zIndex: 1000 }}
            >
              <div className="modal-content" style={{ maxWidth: '600px', padding: '28px', background: 'var(--bg-color)', border: '3px solid var(--border-color)', boxShadow: '8px 8px 0px 0px #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontFamily: 'var(--heading-font)', color: 'var(--primary-color)', fontSize: '20px' }}>
                    Co-Create Announcement
                  </h3>
                  <button type="button" onClick={() => setShowCreateAnnouncementForm(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>
                <AnnouncementForm
                  onSuccess={() => {
                    setShowCreateAnnouncementForm(false);
                    fetchEventsAndAnnouncements();
                    showNotice('Announcement successfully published!');
                  }}
                  onCancel={() => setShowCreateAnnouncementForm(false)}
                />
              </div>
            </div>
          )}

          {/* Add Activity Modal */}
          {selectedEventForActivity && (
            <div
              className="modal-overlay"
              onClick={(e) => { if (e.target === e.currentTarget) setSelectedEventForActivity(null); }}
              style={{ zIndex: 1000 }}
            >
              <div className="modal-content" style={{ maxWidth: '600px', padding: '28px', background: 'var(--bg-color)', border: '3px solid var(--border-color)', boxShadow: '8px 8px 0px 0px #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontFamily: 'var(--heading-font)', color: 'var(--primary-color)', fontSize: '20px' }}>
                      Add Event Activity
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      For event: <strong>{selectedEventForActivity.name}</strong>
                    </p>
                  </div>
                  <button type="button" onClick={() => setSelectedEventForActivity(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>
                <EventActivityForm
                  eventId={selectedEventForActivity.id}
                  onSuccess={() => {
                    setSelectedEventForActivity(null);
                    fetchEventsAndAnnouncements();
                    showNotice('Event activity woven successfully!');
                  }}
                  onCancel={() => setSelectedEventForActivity(null)}
                />
              </div>
            </div>
          )}

          {/* Add Responsibility Modal */}
          {selectedEventForResponsibility && (
            <div
              className="modal-overlay"
              onClick={(e) => { if (e.target === e.currentTarget) setSelectedEventForResponsibility(null); }}
              style={{ zIndex: 1000 }}
            >
              <div className="modal-content" style={{ maxWidth: '600px', padding: '28px', background: 'var(--bg-color)', border: '3px solid var(--border-color)', boxShadow: '8px 8px 0px 0px #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontFamily: 'var(--heading-font)', color: 'var(--responsibility-color)', fontSize: '20px' }}>
                      Add Event Responsibility
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      For event: <strong>{selectedEventForResponsibility.name}</strong>
                    </p>
                  </div>
                  <button type="button" onClick={() => setSelectedEventForResponsibility(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>
                <EventResponsibilityForm
                  eventId={selectedEventForResponsibility.id}
                  currentUser={currentUser}
                  onSuccess={() => {
                    setSelectedEventForResponsibility(null);
                    fetchEventsAndAnnouncements();
                    showNotice('Event responsibility added! Thank you for tending to our gathering.');
                  }}
                  onCancel={() => setSelectedEventForResponsibility(null)}
                />
              </div>
            </div>
          )}

          <EventDetailModal
            event={selectedDetailEvent}
            isOpen={!!selectedDetailEvent}
            onClose={() => setSelectedDetailEvent(null)}
            currentUser={currentUser}
            onRefresh={() => {
              fetchEventsAndAnnouncements();
            }}
          />

          <AnnouncementModal
            announcement={selectedAnnouncement}
            isOpen={!!selectedAnnouncement}
            onClose={() => setSelectedAnnouncement(null)}
            allowEdit={true}
            onRefresh={() => fetchEventsAndAnnouncements()}
          />

          {/* Events List */}
          {loadingEvents ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
              <div className="spinner" style={{ width: 44, height: 44, border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : combinedItems.length === 0 ? (
            <div style={{ border: '2px dashed var(--border-color)', padding: '48px 24px', textAlign: 'center' }}>
              <CalendarDays size={48} style={{ margin: '0 auto 16px auto', opacity: 0.4 }} />
              <p style={{ fontSize: '18px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                No events or announcements have been woven yet. Be the first to start a thread!
              </p>
              <button type="button" className="yellow-btn" onClick={() => setShowCreateEventForm(true)}>
                Co-Create First Event
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                {currentItems.map((item) => {
                  if (item.type === 'announcement') {
                    const ann = item.data;
                    return (
                      <div
                        key={`ann-${ann.id}`}
                        onClick={() => setSelectedAnnouncement(ann)}
                        style={{
                          background: 'var(--bg-color)',
                          border: '3px solid var(--border-color)',
                          boxShadow: '5px 5px 0px 0px #000000',
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{ fontFamily: 'var(--heading-font)', fontSize: '20px', fontWeight: 'bold', margin: 0, color: 'var(--primary-color)' }}>
                              {ann.title}
                            </h3>
                            <span style={{
                              fontSize: '11px',
                              fontFamily: 'var(--mono-font)',
                              background: 'var(--primary-color)',
                              color: '#000',
                              padding: '3px 8px',
                              fontWeight: 'bold',
                              border: '1px solid #000',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {ann.type}
                            </span>
                          </div>

                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Target size={14} /> Published: {new Date(ann.publishAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    const evt = item.data;
                    const activityCount = evt.activities?.length || 0;
                    const responsibilityCount = evt.responsibilities?.length || 0;

                    return (
                      <div
                        key={`evt-${evt.id}`}
                        onClick={() => setSelectedDetailEvent(evt)}
                        style={{
                          background: 'var(--bg-color)',
                          border: '3px solid var(--border-color)',
                          boxShadow: '5px 5px 0px 0px #000000',
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{ fontFamily: 'var(--heading-font)', fontSize: '20px', fontWeight: 'bold', margin: 0, color: 'var(--primary-color)' }}>
                              {evt.name}
                            </h3>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: '11px',
                                fontFamily: 'var(--mono-font)',
                                background: evt.state === 'Scheduled' ? 'var(--primary-color)' : evt.state === 'Cancelled' ? '#ff4444' : '#44bb66',
                                color: evt.state === 'Scheduled' ? '#000' : '#fff',
                                padding: '3px 8px',
                                fontWeight: 'bold',
                                border: '1px solid #000',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                {evt.state || 'Scheduled'}
                              </span>
                              <span style={{ fontSize: '12px', fontFamily: 'var(--mono-font)', background: '#fff', color: '#000', padding: '3px 8px', fontWeight: 'bold', border: '1px solid #000' }}>
                                {new Date(evt.startDateTime).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div><strong>Place:</strong> {evt.eventPlace}</div>
                            {evt.eventLocation && <div><strong>Location:</strong> {evt.eventLocation}</div>}
                            <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px' }}>
                              {new Date(evt.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(evt.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          {evt.description && (
                            <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '20px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {evt.description}
                            </p>
                          )}

                          {/* Counters */}
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <div style={{ background: 'rgba(235, 255, 0, 0.1)', border: '1px solid var(--primary-color)', padding: '6px 10px', fontSize: '12px', color: 'var(--primary-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Layers size={14} /> {activityCount} Event {activityCount === 1 ? 'Activity' : 'Activities'}
                            </div>
                            <div style={{ background: 'rgba(255, 8, 167, 0.1)', border: '1px solid var(--responsibility-color)', padding: '6px 10px', fontSize: '12px', color: 'var(--responsibility-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <User size={14} /> {responsibilityCount} {responsibilityCount === 1 ? 'Responsibility' : 'Responsibilities'}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '16px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEventForActivity(evt);
                              }}
                              style={{
                                background: 'var(--primary-color)',
                                color: '#000',
                                border: '2px solid #000',
                                padding: '8px 10px',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                cursor: 'pointer',
                                textAlign: 'center',
                                boxShadow: '2px 2px 0px #000',
                                transition: 'all 0.1s',
                                borderRadius: '0'
                              }}
                            >
                              + Event Activity
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEventForResponsibility(evt);
                              }}
                              style={{
                                background: 'var(--responsibility-color)',
                                color: '#fff',
                                border: '2px solid #000',
                                padding: '8px 10px',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                cursor: 'pointer',
                                textAlign: 'center',
                                boxShadow: '2px 2px 0px #000',
                                transition: 'all 0.1s',
                                borderRadius: '0'
                              }}
                            >
                              + Responsibility
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
                  <button
                    className="btn-outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="btn-outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: GALLERY */}
      {activeTab === 'gallery' && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--heading-font)', fontSize: '24px', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              Maintain gallery
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
              Click on any polaroid photo to open the lightbox and collaboratively update its description.
            </p>
          </div>
          <Gallery />
        </div>
      )}
    </div>
  );
}
