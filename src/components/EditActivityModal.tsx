"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { secureFetch } from "@/lib/fetch";
import { XCircle } from "@/components/Icons";
import ActivityForm from "@/components/ActivityForm";

export interface EditActivityModalProps {
  readonly onClose: () => void;
  readonly activityId?: string;
}

export default function EditActivityModal({ onClose, activityId }: EditActivityModalProps) {
  const { id: paramId } = useParams() as { id: string };
  const resolvedId = activityId ?? paramId;
  const [activity, setActivity] = useState<any | null>(null);
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 1050 }}>
        <div className="bg-white p-6 rounded-xl shadow-lg">Loading…</div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 1050 }}>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <XCircle size={24} className="text-red-500 mb-2" />
          <p>{error || "Activity not found"}</p>
          <button onClick={onClose} className="mt-4 px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 1050 }} onClick={onClose}>
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-xl" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
}
