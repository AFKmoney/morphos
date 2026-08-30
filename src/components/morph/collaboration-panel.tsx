"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  UserMinus,
  MessageSquare,
  Bell,
  Settings,
  X,
  Search,
  ChevronDown,
  Check,
  Copy,
} from "lucide-react";
import { useUserStore, getOnlineUsers, getCurrentUser, isAuthenticated } from "@/lib/users";
import type { User, SharedWorkspace, WorkspaceMember, UserRole } from "@/lib/users/user-types";

/**
 * Panneau de collaboration
 * 
 * Affiche:
 * - Les utilisateurs en ligne
 * - Les workspaces partagés
 * - Les notifications
 * - Les paramètres de collaboration
 */

export function CollaborationPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'workspaces' | 'notifications' | 'settings'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<SharedWorkspace | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');

  const userStore = useUserStore();
  const currentUser = getCurrentUser();
  const isAuth = isAuthenticated();

  // Récupérer les données
  const onlineUsers = getOnlineUsers();
  const allWorkspaces = userStore.getAllSharedWorkspaces();
  const notifications = userStore.getUnreadNotifications();

  // Créer un nouveau workspace
  const handleCreateWorkspace = () => {
    if (!newWorkspaceName.trim()) return;
    
    const id = userStore.createSharedWorkspace({
      name: newWorkspaceName,
      description: '',
    });
    
    setNewWorkspaceName('');
    setShowCreateWorkspace(false);
    
    // Sélectionner le nouveau workspace
    userStore.setActiveSharedWorkspace(id);
  };

  // Rejoindre un workspace (simulé)
  const handleJoinWorkspace = (workspace: SharedWorkspace) => {
    userStore.setActiveSharedWorkspace(workspace.id);
  };

  // Quitter un workspace
  const handleLeaveWorkspace = (workspaceId: string) => {
    if (currentUser) {
      userStore.leaveSharedWorkspace(workspaceId, currentUser.id);
      if (userStore.getState().activeSharedWorkspaceId === workspaceId) {
        userStore.setActiveSharedWorkspace(null);
      }
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = onlineUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtrer les workspaces
  const filteredWorkspaces = allWorkspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render d'une carte utilisateur
  const renderUserCard = (user: User) => (
    <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
        style={{ backgroundColor: user.color || '#22d3ee' }}
      >
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{user.name}</div>
        {user.email && <div className="text-[11px] text-white/50 truncate">{user.email}</div>}
      </div>
      <div className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
        Online
      </div>
    </div>
  );

  // Render d'une carte workspace
  const renderWorkspaceCard = (workspace: SharedWorkspace) => {
    const isActive = userStore.getState().activeSharedWorkspaceId === workspace.id;
    const isOwner = currentUser?.id === workspace.ownerId;
    const membersCount = workspace.members.length;

    return (
      <div
        key={workspace.id}
        onClick={() => handleJoinWorkspace(workspace)}
        className={`
          flex flex-col gap-2 p-3 rounded-lg border transition-all
          ${isActive 
            ? 'border-cyan-400 bg-cyan-500/10' 
            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">W</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{workspace.name}</span>
              <span className="text-[10px] text-white/40">{membersCount} members</span>
            </div>
          </div>
          
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedWorkspace(workspace);
                setShowInviteModal(true);
              }}
              className="text-[10px] text-white/60 hover:text-white hover:bg-white/10 px-2 py-1 rounded transition-colors"
            >
              Invite
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/40">
            {workspace.shareType}
          </span>
          
          {!isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLeaveWorkspace(workspace.id);
              }}
              className="text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded transition-colors"
            >
              Leave
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render d'une notification
  const renderNotification = (notification: any) => (
    <div
      key={notification.id}
      onClick={() => userStore.markNotificationAsRead(notification.id)}
      className={`
        flex gap-3 p-3 rounded-lg border transition-all
        ${notification.read ? 'border-white/10 bg-transparent' : 'border-cyan-400 bg-cyan-500/10'}
        hover:bg-white/5 cursor-pointer
      `}
    >
      <div className="flex-shrink-0">
        <div className={`w-2 h-2 rounded-full ${notification.read ? 'bg-white/20' : 'bg-cyan-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{notification.title}</div>
        <div className="text-[11px] text-white/60 truncate">{notification.message}</div>
        <div className="text-[10px] text-white/40 mt-1">
          {new Date(notification.createdAt).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full bg-black/20 border-l border-white/10">
      {/* Sidebar */}
      <div className="w-48 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Collaboration</h2>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`
                flex-1 text-[11px] py-1.5 rounded transition-colors
                ${activeTab === 'users' 
                  ? 'bg-cyan-500/20 text-cyan-300' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              Users ({onlineUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('workspaces')}
              className={`
                flex-1 text-[11px] py-1.5 rounded transition-colors
                ${activeTab === 'workspaces' 
                  ? 'bg-cyan-500/20 text-cyan-300' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              Workspaces ({allWorkspaces.length})
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`
                flex-1 text-[11px] py-1.5 rounded transition-colors relative
                ${activeTab === 'notifications' 
                  ? 'bg-cyan-500/20 text-cyan-300' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Bell className="w-3.5 h-3.5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[8px] text-white rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeTab === 'users' && (
            <>
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400"
                />
              </div>
              
              {isAuth ? (
                filteredUsers.length > 0 ? (
                  filteredUsers.map(renderUserCard)
                ) : (
                  <div className="text-center text-white/40 text-sm py-4">
                    No users found
                  </div>
                )
              ) : (
                <div className="text-center text-white/40 text-sm py-4">
                  Connect to see online users
                </div>
              )}
            </>
          )}
          
          {activeTab === 'workspaces' && (
            <>
              <button
                onClick={() => setShowCreateWorkspace(true)}
                className="w-full flex items-center justify-center gap-2 py-1.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors text-sm font-medium mb-3"
              >
                <UserPlus className="w-4 h-4" />
                Create Workspace
              </button>
              
              {filteredWorkspaces.length > 0 ? (
                filteredWorkspaces.map(renderWorkspaceCard)
              ) : (
                <div className="text-center text-white/40 text-sm py-4">
                  No shared workspaces
                </div>
              )}
            </>
          )}
          
          {activeTab === 'notifications' && (
            <div className="space-y-2">
              {notifications.length > 0 ? (
                notifications.map(renderNotification)
              ) : (
                <div className="text-center text-white/40 text-sm py-4">
                  No new notifications
                </div>
              )}
              
              {notifications.length > 0 && (
                <button
                  onClick={() => userStore.markAllNotificationsAsRead()}
                  className="w-full text-center text-[11px] text-cyan-400 hover:text-cyan-300 py-2"
                >
                  Mark all as read
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'users' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-white">Online Users</h3>
            <div className="bg-white/5 rounded-lg p-4">
              {isAuth ? (
                onlineUsers.length > 0 ? (
                  <div className="space-y-2">
                    {onlineUsers.map(renderUserCard)}
                  </div>
                ) : (
                  <div className="text-center text-white/40 py-8">
                    No users online
                  </div>
                )
              ) : (
                <div className="text-center text-white/40 py-8">
                  <p>Connect to see and collaborate with other users</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'workspaces' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Shared Workspaces</h3>
              <button
                onClick={() => setShowCreateWorkspace(true)}
                className="px-3 py-1.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors text-sm font-medium flex items-center gap-1"
              >
                <UserPlus className="w-4 h-4" />
                New Workspace
              </button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              {allWorkspaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allWorkspaces.map(renderWorkspaceCard)}
                </div>
              ) : (
                <div className="text-center text-white/40 py-8">
                  <p>No shared workspaces yet</p>
                  <p className="text-sm mt-2">Create one to start collaborating</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-white">Collaboration Settings</h3>
            <div className="bg-white/5 rounded-lg p-4 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-2 block">Display Name</label>
                <input
                  type="text"
                  value={currentUser?.name || ''}
                  onChange={(e) => {
                    if (currentUser) {
                      userStore.updateUser(currentUser.id, { name: e.target.value });
                    }
                  }}
                  className="w-full max-w-md bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
              
              <div>
                <label className="text-sm text-white/60 mb-2 block">Theme Color</label>
                <div className="flex gap-2">
                  {['#22d3ee', '#34d399', '#f472b6', '#fbbf24', '#c084fc'].map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        if (currentUser) {
                          userStore.updateUser(currentUser.id, { color });
                        }
                      }}
                      className={`w-8 h-8 rounded-full transition-all ${currentUser?.color === color ? 'ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    // À implémenter: copier l'ID de l'utilisateur
                    if (currentUser) {
                      navigator.clipboard.writeText(currentUser.id);
                      userStore.addNotification({
                        type: 'system',
                        title: 'User ID Copied',
                        message: 'Your user ID has been copied to clipboard',
                        severity: 'success',
                      });
                    }
                  }}
                  className="text-sm text-white/60 hover:text-white flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy User ID
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal: Create Workspace */}
      {showCreateWorkspace && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/80 border border-white/10 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create Shared Workspace</h3>
              <button
                onClick={() => setShowCreateWorkspace(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-2 block">Workspace Name</label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="My Workspace"
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateWorkspace(false)}
                  className="flex-1 px-4 py-2 rounded bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkspace}
                  disabled={!newWorkspaceName.trim()}
                  className="flex-1 px-4 py-2 rounded bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal: Invite User */}
      {showInviteModal && selectedWorkspace && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/80 border border-white/10 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Invite to {selectedWorkspace.name}</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedWorkspace(null);
                }}
                className="text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-2 block">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
              
              <div>
                <label className="text-sm text-white/60 mb-2 block">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                >
                  <option value="viewer" className="bg-black text-white">Viewer (Read only)</option>
                  <option value="editor" className="bg-black text-white">Editor (Read & Write)</option>
                  <option value="admin" className="bg-black text-white">Admin (Full access)</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedWorkspace(null);
                    setInviteEmail('');
                  }}
                  className="flex-1 px-4 py-2 rounded bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // À implémenter: envoyer l'invitation
                    console.log(`Inviting ${inviteEmail} to ${selectedWorkspace.name} as ${inviteRole}`);
                    userStore.addNotification({
                      type: 'system',
                      title: 'Invitation Sent',
                      message: `Invitation sent to ${inviteEmail}`,
                      severity: 'success',
                    });
                    setShowInviteModal(false);
                    setSelectedWorkspace(null);
                    setInviteEmail('');
                  }}
                  disabled={!inviteEmail}
                  className="flex-1 px-4 py-2 rounded bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Exporter
export { CollaborationPanel };
