"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { AnyRealtimeMessage, ConnectionStatus } from "./user-types";
import { useUserStore } from "./user-store";

/**
 * Realtime Provider
 * 
 * Fournit une interface pour la communication realtime.
 * Utilise WebSocket ou Firebase selon la configuration.
 * 
 * Pour l'instant, implémente une simulation locale.
 * Dans une vraie implémentation, on utiliserait:
 * - WebSocket (pour self-hosted)
 * - Firebase Realtime Database
 * - Ably
 * - Pusher
 * - etc.
 */

interface RealtimeContextValue {
  // Statut de la connexion
  status: ConnectionStatus;
  
  // Fonctions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  send: (message: AnyRealtimeMessage) => Promise<void>;
  subscribe: (workspaceId: string) => Promise<void>;
  unsubscribe: (workspaceId: string) => Promise<void>;
  
  // Événements
  on: (eventType: AnyRealtimeMessage['type'], callback: (message: AnyRealtimeMessage) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

/**
 * Provider pour le realtime
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());
  const [eventListeners, setEventListeners] = useState<
    Map<AnyRealtimeMessage['type'], Set<(message: AnyRealtimeMessage) => void>>
  >(new Map());
  
  const userStore = useUserStore();
  
  // Connexion
  const connect = useCallback(async () => {
    console.log('[RealtimeProvider] Connecting...');
    setStatus('connecting');
    
    // Simuler un délai de connexion
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setStatus('connected');
    userStore.setConnectionStatus('connected');
    console.log('[RealtimeProvider] Connected');
  }, [userStore]);
  
  // Déconnexion
  const disconnect = useCallback(async () => {
    console.log('[RealtimeProvider] Disconnecting...');
    setStatus('disconnected');
    userStore.setConnectionStatus('disconnected');
    
    // Réinitialiser les subscriptions
    setSubscriptions(new Set());
    setEventListeners(new Map());
    
    console.log('[RealtimeProvider] Disconnected');
  }, [userStore]);
  
  // Envoyer un message
  const send = useCallback(async (message: AnyRealtimeMessage) => {
    if (status !== 'connected') {
      console.warn('[RealtimeProvider] Cannot send message: not connected');
      return;
    }
    
    console.log('[RealtimeProvider] Sending message:', message.type, message);
    
    // Dans une vraie implémentation, on enverrait via WebSocket
    // Pour l'instant, on simule et on déclenche les callbacks locaux
    setTimeout(() => {
      // Déclencher les listeners
      const listeners = eventListeners.get(message.type);
      if (listeners) {
        for (const listener of listeners) {
          listener(message);
        }
      }
      
      // Passer au store
      userStore.handleRealtimeMessage(message);
    }, 100);
  }, [status, eventListeners, userStore]);
  
  // S'abonner à un workspace
  const subscribe = useCallback(async (workspaceId: string) => {
    if (status !== 'connected') {
      console.warn('[RealtimeProvider] Cannot subscribe: not connected');
      return;
    }
    
    console.log('[RealtimeProvider] Subscribing to workspace:', workspaceId);
    setSubscriptions(prev => new Set([...prev, workspaceId]));
    
    // Dans une vraie implémentation, on s'abonnerait via WebSocket
    // Exemple: socket.emit('subscribe', workspaceId)
  }, [status]);
  
  // Se désabonner d'un workspace
  const unsubscribe = useCallback(async (workspaceId: string) => {
    console.log('[RealtimeProvider] Unsubscribing from workspace:', workspaceId);
    setSubscriptions(prev => {
      const next = new Set(prev);
      next.delete(workspaceId);
      return next;
    });
    
    // Dans une vraie implémentation
    // Exemple: socket.emit('unsubscribe', workspaceId)
  }, []);
  
  // Gestion des événements
  const on = useCallback((
    eventType: AnyRealtimeMessage['type'],
    callback: (message: AnyRealtimeMessage) => void
  ) => {
    setEventListeners(prev => {
      const next = new Map(prev);
      if (!next.has(eventType)) {
        next.set(eventType, new Set());
      }
      next.get(eventType)!.add(callback);
      return next;
    });
    
    return () => {
      setEventListeners(prev => {
        const next = new Map(prev);
        const listeners = next.get(eventType);
        if (listeners) {
          listeners.delete(callback);
          if (listeners.size === 0) {
            next.delete(eventType);
          }
        }
        return next;
      });
    };
  }, []);
  
  // Effet pour gérer la connexion automatique
  useEffect(() => {
    // Se connecter automatiquement si un utilisateur est connecté
    const user = useUserStore.getState().currentUser;
    if (user && status === 'disconnected') {
      queueMicrotask(() => connect());
    }
    
    // Se déconnecter si l'utilisateur se déconnecte
    return () => {
      if (status === 'connected') {
        queueMicrotask(() => disconnect());
      }
    };
  }, [user, status, connect, disconnect]);
  
  // Effet pour gérer les messages entrants
  // (Dans une vraie implémentation, on écouterait WebSocket)
  useEffect(() => {
    // Pour l'instant, rien à faire
    // Dans une vraie implémentation:
    // socket.on('message', (message: AnyRealtimeMessage) => {
    //   userStore.handleRealtimeMessage(message);
    //   const listeners = eventListeners.get(message.type);
    //   if (listeners) {
    //     for (const listener of listeners) {
    //       listener(message);
    //     }
    //   }
    // });
  }, [userStore, eventListeners]);
  
  const value: RealtimeContextValue = {
    status,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    on,
  };
  
  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

/**
 * Hook pour utiliser le realtime
 */
export function useRealtime() {
  const context = useContext(RealtimeContext);
  
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  
  return context;
}

/**
 * Composant pour afficher le statut de la connexion
 */
export function RealtimeStatus() {
  const { status } = useRealtime();
  
  const statusColors: Record<ConnectionStatus, string> = {
    disconnected: 'text-rose-400',
    connecting: 'text-amber-400',
    connected: 'text-emerald-400',
    reconnecting: 'text-amber-400',
    error: 'text-rose-400',
  };
  
  const statusLabels: Record<ConnectionStatus, string> = {
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
    connected: 'Connected',
    reconnecting: 'Reconnecting...',
    error: 'Error',
  };
  
  return (
    <div className={`flex items-center gap-1 text-[10px] ${statusColors[status]}`}>
      <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-current'}`} />
      <span>{statusLabels[status]}</span>
    </div>
  );
}

// Exporter
export { RealtimeContext };
