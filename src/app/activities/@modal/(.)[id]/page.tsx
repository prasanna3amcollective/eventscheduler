"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { secureFetch } from "@/lib/fetch";
import { format } from "date-fns";
import { XCircle, CheckCircle } from "@/components/Icons";

interface Participant {
  id: string;
  type?: string;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    phone: string;
  };
  sys_created_at: string;
  attendance?: number;
  payAsYouWish?: number;
}

interface Activity {
  id: string;
  name: string;
  startDateTime: string;
  endDateTime: string;
  duration: number;
  state?: string;
  participants: Participant[];
}

export default function EditActivityModal() {
  const { id } = useParams();
  const router = useRouter();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await secureFetch(`/api/activities/${id}`);
        if (res.ok) {
          const data = await res.json();
          setActivity(data);
        } else {
          setError("Failed to load activity");
        }
      } catch (e) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-var(--bg-color) p-6 rounded shadow">Loading…</div>
      </div>
    );
  }
  if (error || !activity) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-var(--bg-color) p-6 rounded shadow">
          <XCircle size={24} className="text-red-500 mb-2" />
          <p>{error || "Activity not found"}</p>
          <button onClick={() => router.back()} className="mt-4 btn-primary">Close</button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    // Placeholder – real implementation would POST/PATCH the changes
    alert("Save not implemented in this demo");
    router.back();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={() => router.back()}>
      <div className="bg-var(--bg-color) p-6 rounded shadow max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">Edit Activity – {activity.name}</h2>
        <div className="grid gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium mb-1">Name</span>
            <input type="text" defaultValue={activity.name} className="input" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium mb-1">Start</span>
            <input type="datetime-local" defaultValue={format(new Date(activity.startDateTime), "yyyy-MM-dd'T'HH:mm"} className="input" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium mb-1">End</span>
            <input type="datetime-local" defaultValue={format(new Date(activity.endDateTime), "yyyy-MM-dd'T'HH:mm"} className="input" />
          </label>
        </div>
        <div className="flex justify-end mt-6 gap-3">
          <button onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
}
