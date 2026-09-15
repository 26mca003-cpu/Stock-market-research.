"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Play, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { SkeletonTable } from "@/components/Skeleton";

export default function PipelinesPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<Record<string, boolean>>({});

  const fetchJobs = async () => {
    try {
      const res = await api.get("/admin/jobs");
      setJobs(res);
    } catch (e) {
      console.error("Failed to load jobs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  const runJob = async (jobName: string) => {
    setRunning(prev => ({ ...prev, [jobName]: true }));
    try {
      await api.post(`/admin/jobs/${jobName}/run`, {});
      setTimeout(fetchJobs, 2000);
    } catch (e) {
      alert("Failed to start job");
    } finally {
      setTimeout(() => setRunning(prev => ({ ...prev, [jobName]: false })), 3000);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-primary">Pipelines</h1>
        <p className="text-slate-500 mt-1">Manage and monitor automated cron jobs.</p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
        {loading ? (
          <div className="p-0"><SkeletonTable rows={4} cols={6} /></div>
        ) : (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50/70 border-b border-border text-[11px] uppercase tracking-wider text-primary-muted font-semibold">
            <tr>
              <th className="px-4 sm:px-6 py-4">Job Name</th>
              <th className="px-4 sm:px-6 py-4">Last Status</th>
              <th className="px-4 sm:px-6 py-4">Last Run</th>
              <th className="px-4 sm:px-6 py-4">Duration</th>
              <th className="px-4 sm:px-6 py-4">Rows Processed</th>
              <th className="px-4 sm:px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <tr key={job.job_name} className="hover:bg-slate-50/50">
                <td className="px-4 sm:px-6 py-4 font-semibold text-primary">{job.job_name}</td>
                <td className="px-4 sm:px-6 py-4">
                  {job.last_status === "success" ? (
                    <span className="inline-flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Success
                    </span>
                  ) : job.last_status === "running" ? (
                    <span className="inline-flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                      <AlertTriangle className="w-4 h-4 mr-1.5" /> Running
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-md">
                      <XCircle className="w-4 h-4 mr-1.5" /> Failed
                    </span>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-4 text-slate-600">
                  {new Date(job.last_started).toLocaleString()}
                </td>
                <td className="px-4 sm:px-6 py-4 text-slate-600">
                  {job.duration_ms ? `${(job.duration_ms / 1000).toFixed(1)}s` : "-"}
                </td>
                <td className="px-4 sm:px-6 py-4 text-slate-600">{job.rows_processed}</td>
                <td className="px-4 sm:px-6 py-4">
                  <button
                    onClick={() => runJob(job.job_name)}
                    disabled={running[job.job_name] || job.last_status === "running"}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-11 sm:h-9 px-4 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run Now
                  </button>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 sm:px-6 py-8 text-center text-slate-500">
                  No job runs recorded yet. Wait for cron or trigger manually.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        )}
      </div>
    </div>
  );
}
