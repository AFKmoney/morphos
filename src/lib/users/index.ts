// User System exports
// Ce fichier exporte tout ce qui est nécessaire pour le système Multi-User

export type {
  User,
  UserId,
  UserRole,
  UserSettings,
  UserPresence,
  UserSession,
  SharedWorkspace,
  SharedWorkspaceId,
  WorkspaceMember,
  WorkspacePermission,
  CollaborationChange,
  CollaborationHistory,
  RealtimeMessageType,
  AnyRealtimeMessage,
  PresenceUpdateMessage,
  WorkspaceJoinLeaveMessage,
  ChangeApplyMessage,
  ChangeUndoRedoMessage,
  ChatMessage,
  CursorMoveMessage,
  SelectionChangeMessage,
  NotifyMessage,
  ConnectionStatus,
  ConnectionInfo,
  WorkspaceInvitation,
  NotificationType,
  UserNotification,
} from "./user-types";

export {
  useUserStore,
  getCurrentUser,
  getCurrentSession,
  isAuthenticated,
  hasRole,
  hasWorkspacePermission,
  getOnlineUsers,
  getWorkspaceMembers,
} from "./user-store";
