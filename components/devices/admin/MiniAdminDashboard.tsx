"use client";
import React, { useCallback, useEffect, useState } from "react";

// Import new components
import DashboardOverview from "./DashboardOverview";
import AccessCodesSection from "./AccessCodesSection";
import PlayspacesSection from "./PlayspacesSection";
import DevicesSection from "./DevicesSection";
import EventsSection from "./EventsSection";
import SessionsSection from "./SessionsSection";
import TeamsSection from "./TeamsSection";
import SponsorsSection from "./SponsorsSection";
import MessagingSection from "./MessagingSection";
import Notifications from "./Notifications";
import BulkDeleteModal from "./BulkDeleteModal";

// Import types
import { AccessCode, Playspace, Device, EventItem, GameSession, Tab, Note, Team, Sponsor } from "./shared-types";

// Server actions
import { getAccessCodes, generateAccessCode, toggleAccessCodeStatus, deleteAccessCode, updateAccessCode, linkAccessCodeToPlayspace } from "@/app/actions/admin";
import { getPlayspaces, createPlayspace, updatePlayspace, deletePlayspace } from "@/app/actions/admin";
import { getAllDevices, createDevice, updateDevice, deleteDevice, assignDeviceToPlayspace, unassignDeviceFromPlayspace } from "@/app/actions/admin";
import { getEvents } from "@/app/actions/admin";
import { getGameSessions, updateGameSessionScore, endGameSession } from "@/app/actions/admin";
import { getTeams, createTeam, updateTeam, deleteTeam } from "@/app/actions/admin";
import { createEvent, updateEvent, deleteEvent, toggleEventRegistration } from "@/app/actions/admin";
import { getSponsors, createSponsor, updateSponsor, deleteSponsor } from "@/app/actions/admin";
import { logger } from '@/lib/logger';

const TABS: Tab[] = ["dashboard", "teams", "codes", "playspaces", "devices", "events", "sessions", "sponsors", "messaging"];

const authKey = () => (typeof window !== "undefined" ? localStorage.getItem("admin-auth-key") || undefined : undefined);

export default function MiniAdminDashboard() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [plays, setPlays] = useState<Playspace[]>([]);
  const [devs, setDevs] = useState<Device[]>([]);
  const [evts, setEvts] = useState<EventItem[]>([]);
  const [sess, setSess] = useState<GameSession[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [q, setQ] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [bulk, setBulk] = useState<string[] | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    type: "temporary",
    priority: 5,
    maxUsages: "",
    expiresInHours: "",
    description: "",
    playspaceId: "",
  });

  const note = (n: Omit<Note, "id">) => {
    const id = crypto.randomUUID();
    setNotes((p) => [...p, { ...n, id }]);
    setTimeout(() => setNotes((p) => p.filter((x) => x.id !== id)), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const key = authKey();
      const [ac, pl, dv, ev, gs, tm, sp] = await Promise.all([
        getAccessCodes(key),
        getPlayspaces(key),
        getAllDevices(key),
        getEvents(key),
        getGameSessions(key),
        getTeams(key),
        getSponsors(key),
      ]);

      // Transform access codes to match expected type
      const transformedCodes = (ac?.accessCodes || []).map(code => ({
        _id: code._id,
        code: code.code,
        status: code.isActive ? "active" as const : "inactive" as const,
      }));
      setCodes(transformedCodes);

      // Transform playspaces to match expected type
      const transformedPlays = (pl?.playspaces || []).map(play => ({
        _id: play._id,
        name: play.name,
        description: play.description,
      }));
      setPlays(transformedPlays);

      // Transform devices to match expected type
      const transformedDevs = (dv?.devices || []).map(dev => ({
        _id: dev._id,
        name: dev.deviceMacAddress || "Unknown Device",
        status: dev.status || "unknown",
        deviceType: dev.deviceType,
        playspace: dev.playspace,
      }));
      setDevs(transformedDevs);

      // Transform events to match expected type
      const transformedEvts = (ev?.events || []).map(evt => ({
        _id: evt._id ? evt._id.toString() : "",
        title: evt.title || "Unknown Event",
        description: evt.description,
        startDate: evt.startDate,
        endDate: evt.endDate,
        location: evt.location,
        category: evt.category,
        isPublic: evt.isPublic,
        capacity: evt.capacity,
        registrationEnabled: evt.registrationEnabled,
        requiredDeviceTypes: evt.requiredDeviceTypes ? {
          mobile: evt.requiredDeviceTypes.mobile || false,
          desktop: evt.requiredDeviceTypes.desktop || false,
        } : { mobile: false, desktop: false },
        requiredDevices: evt.requiredDevices ? {
          mobile: Array.isArray(evt.requiredDevices.mobile) ? evt.requiredDevices.mobile : [],
          desktop: Array.isArray(evt.requiredDevices.desktop) ? evt.requiredDevices.desktop : [],
        } : { mobile: [], desktop: [] },
        minTeamMembers: evt.minTeamMembers,
        maxTeamMembers: evt.maxTeamMembers,
        pricing: evt.pricing ? {
          normal: typeof evt.pricing.normal === 'number' ? evt.pricing.normal : 0,
          extended: typeof evt.pricing.extended === 'number' ? evt.pricing.extended : undefined,
        } : { normal: 0 },
      }));
      setEvts(transformedEvts);

      // Transform game sessions to match expected type
      const transformedSess = (gs?.sessions || []).map(sess => ({
        _id: sess._id,
        tournamentId: sess.tournamentId,
        team1Id: sess.team1Id,
        team2Id: sess.team2Id,
        team1Name: sess.team1Name,
        team2Name: sess.team2Name,
        status: sess.status,
        startTime: sess.startTime,
        endTime: sess.endTime,
        team1Score: sess.team1Score,
        team2Score: sess.team2Score,
        duration: sess.duration,
        winner: sess.winner,
        deviceId: sess.deviceId,
      }));
      setSess(transformedSess);

      // Transform teams to match expected type
      const transformedTeams = (tm?.teams || []).map(team => ({
        _id: team._id ? team._id.toString() : "",
        name: team.name,
        description: team.description,
        leaderUserId: team.leaderUserId,
        members: team.members,
      }));
      setTeams(transformedTeams);

      // Transform sponsors to match expected type
      const transformedSponsors = (sp?.sponsors || []).map(sponsor => ({
        _id: sponsor._id,
        name: sponsor.name,
        tier: sponsor.tier,
        logo: sponsor.logo,
        description: sponsor.description,
        benefits: sponsor.benefits,
        websiteUrl: sponsor.websiteUrl,
        isActive: sponsor.isActive,
        createdAt: sponsor.createdAt,
        updatedAt: sponsor.updatedAt,
      }));
      setSponsors(transformedSponsors);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Load failed";
      setErr(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const bulkDel = async () => {
    if (!bulk) return;
    try {
      for (const id of bulk) {
        await deleteAccessCode(id, authKey());
      }
      note({ kind: "ok", msg: "Deleted" });
      setBulk(null);
      load();
    } catch {
      note({ kind: "err", msg: "Bulk failed" });
    }
  };

  const adjust = async (id: string, d: number) => {
    try {
      // Find the current session to get existing scores
      const session = sess.find(s => s._id === id);
      if (!session) {
        note({ kind: "err", msg: "Session not found" });
        return;
      }

      // Adjust team1Score (you could modify this to adjust team2Score based on some logic)
      const newTeam1Score = Math.max(0, session.team1Score + d);
      await updateGameSessionScore(id, newTeam1Score, session.team2Score, authKey());
      load();
    } catch {
      note({ kind: "err", msg: "Score update failed" });
    }
  };

  const end = async (id: string) => {
    try {
      const session = sess.find(s => s._id === id);
      if (!session) {
        note({ kind: "err", msg: "Session not found" });
        return;
      }

      // Determine winner based on scores
      let winner = "draw";
      if (session.team1Score > session.team2Score) {
        winner = session.team1Id;
      } else if (session.team2Score > session.team1Score) {
        winner = session.team2Id;
      }

      await endGameSession(id, winner, authKey());
      load();
    } catch {
      note({ kind: "err", msg: "End session failed" });
    }
  };

  const handleGenerate = async () => {
    setShowCreateModal(true);
  };

  const handleCreateAccessCode = async () => {
    try {
      const maxUsages = createFormData.maxUsages ? parseInt(createFormData.maxUsages) : undefined;
      const expiresInHours = createFormData.expiresInHours ? parseInt(createFormData.expiresInHours) : undefined;

      await generateAccessCode(
        createFormData.type,
        createFormData.priority,
        maxUsages,
        expiresInHours,
        createFormData.description || undefined,
        createFormData.playspaceId || undefined,
        authKey()
      );

      note({ kind: "ok", msg: "Access code created successfully" });
      setShowCreateModal(false);
      setCreateFormData({
        type: "temporary",
        priority: 5,
        maxUsages: "",
        expiresInHours: "",
        description: "",
        playspaceId: "",
      });
      load();
    } catch (error) {
      logger.error('Error creating access code:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      note({ kind: "err", msg: "Failed to create access code" });
    }
  };

  const handleToggle = async (id: string, status: boolean) => {
    try {
      await toggleAccessCodeStatus(id, status, authKey());
      load();
    } catch {
      note({ kind: "err", msg: "Toggle" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccessCode(id, authKey());
      load();
    } catch {
      note({ kind: "err", msg: "Del fail" });
    }
  };

    // Team management functions
  const handleCreateTeam = async (name: string, description: string, numberOfPlayers: number, playingDevice: "smartphone" | "pc_laptop", leaderId?: string) => {
    try {
      await createTeam(name, description, numberOfPlayers, playingDevice, leaderId, authKey());
      note({ kind: "ok", msg: "Team created" });
      load();
    } catch (error) {
      logger.error('Error creating team:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      note({ kind: "err", msg: "Create team failed" });
    }
  };

  const handleUpdateTeam = async (id: string, updates: { name?: string; description?: string; leaderUserId?: string }) => {
    try {
      await updateTeam(id, updates, authKey());
      note({ kind: "ok", msg: "Team updated" });
      load();
    } catch {
      note({ kind: "err", msg: "Update team failed" });
    }
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      await deleteTeam(id, authKey());
      note({ kind: "ok", msg: "Team deleted" });
      load();
    } catch {
      note({ kind: "err", msg: "Delete team failed" });
    }
  };

  // Sponsor management functions
  const handleCreateSponsor = async (
    name: string,
    tier: 'quantum-guardians' | 'cyber-sentinels' | 'binary-titans' | 'firewall-champions',
    logo: string,
    description: string,
    benefits: string[],
    websiteUrl: string
  ) => {
    try {
      await createSponsor(name, tier, logo, description, benefits, websiteUrl, authKey());
      note({ kind: "ok", msg: "Sponsor created" });
      load();
    } catch (error) {
      logger.error('Error creating sponsor:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      note({ kind: "err", msg: "Create sponsor failed" });
    }
  };

  const handleUpdateSponsor = async (
    id: string,
    updates: {
      name?: string;
      tier?: 'quantum-guardians' | 'cyber-sentinels' | 'binary-titans' | 'firewall-champions';
      logo?: string;
      description?: string;
      benefits?: string[];
      websiteUrl?: string;
      isActive?: boolean;
    }
  ) => {
    try {
      await updateSponsor(id, updates, authKey());
      note({ kind: "ok", msg: "Sponsor updated" });
      load();
    } catch {
      note({ kind: "err", msg: "Update sponsor failed" });
    }
  };

  const handleDeleteSponsor = async (id: string) => {
    try {
      await deleteSponsor(id, authKey());
      note({ kind: "ok", msg: "Sponsor deleted" });
      load();
    } catch {
      note({ kind: "err", msg: "Delete sponsor failed" });
    }
  };

  // Playspace management functions
  const handleCreatePlayspace = async (name: string, description: string) => {
    try {
      await createPlayspace(name, description, false, [], authKey());
      note({ kind: "ok", msg: "Playspace created" });
      load();
    } catch {
      note({ kind: "err", msg: "Create playspace failed" });
    }
  };

  const handleUpdatePlayspace = async (id: string, name: string, description: string) => {
    try {
      await updatePlayspace(id, name, description, authKey());
      note({ kind: "ok", msg: "Playspace updated" });
      load();
    } catch {
      note({ kind: "err", msg: "Update playspace failed" });
    }
  };

  const handleDeletePlayspace = async (id: string) => {
    try {
      await deletePlayspace(id, authKey());
      note({ kind: "ok", msg: "Playspace deleted" });
      load();
    } catch {
      note({ kind: "err", msg: "Delete playspace failed" });
    }
  };

  // Device management functions
  const handleCreateDevice = async (deviceType: string) => {
    try {
      await createDevice(deviceType, authKey());
      note({ kind: "ok", msg: "Device created" });
      load();
    } catch {
      note({ kind: "err", msg: "Create device failed" });
    }
  };

  const handleUpdateDevice = async (id: string, updates: { deviceType?: string; status?: string; playspaceId?: string }) => {
    try {
      await updateDevice(id, updates, authKey());
      note({ kind: "ok", msg: "Device updated" });
      load();
    } catch {
      note({ kind: "err", msg: "Update device failed" });
    }
  };

  const handleAssignDevice = async (deviceId: string, playspaceId: string) => {
    try {
      await assignDeviceToPlayspace(deviceId, playspaceId, authKey());
      note({ kind: "ok", msg: "Device assigned" });
      load();
    } catch {
      note({ kind: "err", msg: "Assign device failed" });
    }
  };

  const handleUnassignDevice = async (deviceId: string) => {
    try {
      await unassignDeviceFromPlayspace(deviceId, authKey());
      note({ kind: "ok", msg: "Device unassigned" });
      load();
    } catch {
      note({ kind: "err", msg: "Unassign device failed" });
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      await deleteDevice(deviceId, authKey());
      note({ kind: "ok", msg: "Device deleted" });
      load();
    } catch {
      note({ kind: "err", msg: "Delete device failed" });
    }
  };

  // Event management functions
  const handleCreateEvent = async (eventData: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    category: string;
    isPublic: boolean;
    capacity: number;
    requiredDeviceTypes: { mobile: boolean; desktop: boolean };
    requiredDevices: { mobile: string[]; desktop: string[] };
    minTeamMembers: number;
    maxTeamMembers: number;
    pricingNormal: number;
    pricingExtended?: number;
  }) => {
    try {
      await createEvent(
        eventData.title,
        eventData.description,
        new Date(eventData.startDate + ':00'), // Add seconds to ensure proper parsing
        new Date(eventData.endDate + ':00'), // Add seconds to ensure proper parsing
        eventData.location,
        eventData.category,
        eventData.isPublic,
        eventData.capacity,
        eventData.requiredDeviceTypes,
        eventData.requiredDevices,
        eventData.minTeamMembers,
        eventData.maxTeamMembers,
        eventData.pricingNormal,
        eventData.pricingExtended,
        authKey()
      );
      note({ kind: "ok", msg: "Event created" });
      load();
    } catch {
      note({ kind: "err", msg: "Create event failed" });
    }
  };

  const handleUpdateEvent = async (id: string, updates: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    category?: string;
    isPublic?: boolean;
    capacity?: number;
    requiredDeviceTypes?: { mobile: boolean; desktop: boolean };
    requiredDevices?: { mobile: string[]; desktop: string[] };
    minTeamMembers?: number;
    maxTeamMembers?: number;
    pricingNormal?: number;
    pricingExtended?: number;
  }) => {
    try {
      const transformedUpdates: {
        title?: string;
        description?: string;
        startDate?: Date;
        endDate?: Date;
        location?: string;
        category?: string;
        isPublic?: boolean;
        capacity?: number;
        requiredDeviceTypes?: { mobile: boolean; desktop: boolean };
        requiredDevices?: { mobile: string[]; desktop: string[] };
        minTeamMembers?: number;
        maxTeamMembers?: number;
        pricingNormal?: number;
        pricingExtended?: number;
      } = {};

      if (updates.title) transformedUpdates.title = updates.title;
      if (updates.description) transformedUpdates.description = updates.description;
      if (updates.startDate) transformedUpdates.startDate = new Date(updates.startDate + ':00');
      if (updates.endDate) transformedUpdates.endDate = new Date(updates.endDate + ':00');
      if (updates.location) transformedUpdates.location = updates.location;
      if (updates.category) transformedUpdates.category = updates.category;
      if (updates.isPublic !== undefined) transformedUpdates.isPublic = updates.isPublic;
      if (updates.capacity !== undefined) transformedUpdates.capacity = updates.capacity;
      if (updates.requiredDeviceTypes) transformedUpdates.requiredDeviceTypes = updates.requiredDeviceTypes;
      if (updates.requiredDevices) transformedUpdates.requiredDevices = updates.requiredDevices;
      if (updates.minTeamMembers !== undefined) transformedUpdates.minTeamMembers = updates.minTeamMembers;
      if (updates.maxTeamMembers !== undefined) transformedUpdates.maxTeamMembers = updates.maxTeamMembers;
      if (updates.pricingNormal !== undefined) transformedUpdates.pricingNormal = updates.pricingNormal;
      if (updates.pricingExtended !== undefined) transformedUpdates.pricingExtended = updates.pricingExtended;

      await updateEvent(id, transformedUpdates, authKey());
      note({ kind: "ok", msg: "Event updated" });
      load();
    } catch {
      note({ kind: "err", msg: "Update event failed" });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteEvent(id, authKey());
      note({ kind: "ok", msg: "Event deleted" });
      load();
    } catch {
      note({ kind: "err", msg: "Delete event failed" });
    }
  };

  const handleToggleEventRegistration = async (id: string) => {
    try {
      const result = await toggleEventRegistration(id, authKey());
      if (result.success) {
        note({ kind: "ok", msg: result.message || "Registration status updated" });
        load();
      } else {
        note({ kind: "err", msg: result.error || "Toggle registration failed" });
      }
    } catch {
      note({ kind: "err", msg: "Toggle registration failed" });
    }
  };

  // Access code management functions
  const handleUpdateAccessCode = async (id: string, updates: { code?: string; type?: string; priority?: number; description?: string; maxUsages?: number; isActive?: boolean }) => {
    try {
      await updateAccessCode(id, updates, authKey());
      note({ kind: "ok", msg: "Access code updated" });
      load();
    } catch {
      note({ kind: "err", msg: "Update access code failed" });
    }
  };

  const handleLinkAccessCode = async (codeId: string, playspaceId: string | null) => {
    try {
      await linkAccessCodeToPlayspace(codeId, playspaceId, authKey());
      note({ kind: "ok", msg: playspaceId ? "Access code linked" : "Access code unlinked" });
      load();
    } catch {
      note({ kind: "err", msg: "Link access code failed" });
    }
  };

  const body = () => {
    switch (tab) {
      case "dashboard":
        return <DashboardOverview codes={codes} plays={plays} devs={devs} evts={evts} sess={sess} teams={teams} sponsors={sponsors} />;
      case "teams":
        return (
          <TeamsSection
            teams={teams}
            q={q}
            setQ={setQ}
            onCreateTeam={handleCreateTeam}
            onUpdateTeam={handleUpdateTeam}
            onDeleteTeam={handleDeleteTeam}
          />
        );
      case "codes":
        return (
          <AccessCodesSection
            codes={codes}
            q={q}
            setQ={setQ}
            setBulk={setBulk}
            onGenerate={handleGenerate}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onUpdateCode={handleUpdateAccessCode}
            onLinkCode={handleLinkAccessCode}
            playspaces={plays}
          />
        );
      case "playspaces":
        return <PlayspacesSection 
          plays={plays} 
          q={q} 
          setQ={setQ}
          onCreatePlayspace={handleCreatePlayspace}
          onUpdatePlayspace={handleUpdatePlayspace}
          onDeletePlayspace={handleDeletePlayspace}
        />;
      case "devices":
        return <DevicesSection 
          devs={devs} 
          q={q} 
          setQ={setQ}
          onCreateDevice={handleCreateDevice}
          onUpdateDevice={handleUpdateDevice}
          onAssignDevice={handleAssignDevice}
          onUnassignDevice={handleUnassignDevice}
          onDeleteDevice={handleDeleteDevice}
          playspaces={plays}
        />;
      case "events":
        return <EventsSection 
          evts={evts} 
          q={q} 
          setQ={setQ}
          onCreateEvent={handleCreateEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
          onToggleRegistration={handleToggleEventRegistration}
        />;
      case "sessions":
        return <SessionsSection sess={sess} q={q} setQ={setQ} onAdjust={adjust} onEnd={end} />;
      case "sponsors":
        return <SponsorsSection 
          sponsors={sponsors} 
          q={q} 
          setQ={setQ}
          onCreateSponsor={handleCreateSponsor}
          onUpdateSponsor={handleUpdateSponsor}
          onDeleteSponsor={handleDeleteSponsor}
        />;
      case "messaging":
        return <MessagingSection devs={devs} teams={teams} q={q} setQ={setQ} />;
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded text-xs border border-neutral-700 ${
              tab === t ? "bg-neutral-200 text-black" : "bg-neutral-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {loading && <div className="text-xs text-neutral-400">Loading...</div>}
      {err && (
        <div className="text-xs p-2 bg-red-600/20 border border-red-500 rounded text-red-200">
          {err}
        </div>
      )}
      <div className="min-h-[200px]">{body()}</div>
      <Notifications notes={notes} />
      <BulkDeleteModal bulk={bulk} onConfirm={bulkDel} onCancel={() => setBulk(null)} />

      {/* Create Access Code Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Access Code</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={createFormData.type}
                  onChange={(e) => setCreateFormData({ ...createFormData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-700 rounded text-sm"
                >
                  <option value="temporary">Temporary</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority (1-9)</label>
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={createFormData.priority}
                  onChange={(e) => setCreateFormData({ ...createFormData, priority: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 bg-neutral-700 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Max Usages (optional)</label>
                <input
                  type="number"
                  min="1"
                  value={createFormData.maxUsages}
                  onChange={(e) => setCreateFormData({ ...createFormData, maxUsages: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  className="w-full px-3 py-2 bg-neutral-700 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Expires in Hours (optional)</label>
                <input
                  type="number"
                  min="1"
                  value={createFormData.expiresInHours}
                  onChange={(e) => setCreateFormData({ ...createFormData, expiresInHours: e.target.value })}
                  placeholder="Leave empty for no expiration"
                  className="w-full px-3 py-2 bg-neutral-700 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  placeholder="Enter description"
                  className="w-full px-3 py-2 bg-neutral-700 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assign to Playspace (optional)</label>
                <select
                  value={createFormData.playspaceId}
                  onChange={(e) => setCreateFormData({ ...createFormData, playspaceId: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-700 rounded text-sm"
                >
                  <option value="">Select playspace (optional)</option>
                  {plays.map(playspace => (
                    <option key={playspace._id} value={playspace._id}>{playspace.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateAccessCode}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
              >
                Create Access Code
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 rounded text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
