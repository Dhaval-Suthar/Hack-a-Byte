"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAvailableRoles, validateAndUseAccessCode } from "@/app/actions/userProgress";

function RoleSelectionClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [accessCode, setAccessCode] = useState("");
  const [username, setUsername] = useState("");
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const code = params?.get("code") || "";
    setAccessCode(code);
    if (!code) {
      setError("Missing access code");
      setLoading(false);
      return;
    }
    (async () => {
      const res = await getAvailableRoles(code);
      if (res.success) {
        setAvailableRoles(res.availableRoles || []);
      } else {
        setError(res.error || "Failed to load roles");
      }
      setLoading(false);
    })();
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) return setError("Enter a username");
    if (!selectedRole) return setError("Select a role");
    const res = await validateAndUseAccessCode({ accessCode, username: username.trim(), role: selectedRole });
    if (!res.success) {
      setError(res.error || "Failed to join team");
      // Refresh roles in case of duplicate role
      const refresh = await getAvailableRoles(accessCode);
      if (refresh.success) setAvailableRoles(refresh.availableRoles || []);
      return;
    }
    // When all joined or not, continue to device selection (device will be online only after all joined)
    router.push("/device-selection");
  };

  return (
    <main className="min-h-screen bg-black text-green-400 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border-2 border-green-500 rounded-lg p-6">
        <h1 className="text-2xl font-mono font-bold mb-4">Select Your Role</h1>
        {loading ? (
          <p className="font-mono">Loading...</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-mono mb-1">Access Code</label>
              <input value={accessCode} readOnly className="w-full bg-gray-800 border border-green-500 rounded px-3 py-2 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-mono mb-1">Username</label>
              <input value={username} onChange={(e)=>setUsername(e.target.value)} className="w-full bg-gray-800 border border-green-500 rounded px-3 py-2 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-mono mb-1">Role</label>
              <select value={selectedRole} onChange={(e)=>setSelectedRole(e.target.value)} className="w-full bg-gray-800 border border-green-500 rounded px-3 py-2 font-mono">
                <option value="">Select a role</option>
                {availableRoles.map((r)=> (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {availableRoles.length === 0 && (
                <p className="text-yellow-400 text-xs mt-1 font-mono">No roles available. Team might be full.</p>
              )}
            </div>
            {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
            <button type="submit" className="w-full bg-green-900/30 border border-green-500 text-green-400 px-4 py-2 rounded font-mono hover:bg-green-800/30">Join Team</button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function RoleSelectionPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black text-green-400 flex items-center justify-center p-4"><p className="font-mono">Loading...</p></main>}>
      <RoleSelectionClient />
    </Suspense>
  );
}
