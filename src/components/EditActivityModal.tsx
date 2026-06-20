"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { secureFetch } from "@/lib/fetch";
import { XCircle, X } from "@/components/Icons";
import ActivityForm from "@/components/ActivityForm";

export interface EditActivityModalProps {
  readonly onClose: () => void;
  readonly activityId?: string;
}

export default function EditActivityModal({ onClose, activityId }: EditActivityModalProps) {
  const { id: paramId } = useParams() as { id: string };
  const resolvedId = activityId ?? paramId;
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await secureFetch(`/api/activities/${resolvedId}`);
        if (!res.ok) {
          setError("Failed to load activity");
          setLoading(false);
          return;
        }
        const data = await res.json();

        // 1. ACL check
        const meRes = await secureFetch("/api/auth/me");
        if (!meRes.ok) {
          setError("Not authorized to edit this activity");
          setLoading(false);
          return;
        }
        const meData = await meRes.json();
        const currentUser = meData.user;

        // Check if user is a Leader of this activity
        const isLeader = data.participants?.some(
          (p: any) => p.user?.id === currentUser?.id && p.type === 'Leader'
        );

        // Use the dynamic ACL permission fetched from the server
        const canEdit = meData.permissions?.canEditActivity || isLeader;
        if (!canEdit) {
          setError("You do not have permission to edit this activity.");
          setLoading(false);
          return;
        }

        setActivity(data);
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };
    if (resolvedId) load();
  }, [resolvedId]);

  if (loading) {
    return (
      <div className="modal-overlay" style={{ zIndex: 1050 }}>
        <div className="neo-confirm-modal">
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="modal-overlay" style={{ zIndex: 1050 }}>
        <div className="neo-confirm-modal">
          <XCircle size={24} style={{ color: 'var(--error-color)', marginBottom: '16px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
          <p>{error || "Activity not found"}</p>
          <div className="neo-confirm-actions">
            <button onClick={onClose} className="yellow-btn" style={{ margin: 0 }}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div 
      className="modal-overlay" 
      style={{ zIndex: 1050, alignItems: 'flex-start', paddingTop: '5vh' }} 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div style={{ position: 'relative', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
        <ActivityForm
          initialData={activity}
          onActivityCreated={() => {
            onClose();
            // Option to reload to show changes in the parent component
            window.location.reload();
          }}
          onCancel={onClose}
        />
      </div>
      <button className="modal-close" onClick={onClose} style={{ position: 'fixed', top: 'calc(5vh - 12px)', right: 'max(16px, calc(50% - 425px - 12px))', zIndex: 1150 }}>
        <X size={20} />
      </button>
    </div>
  );
}
