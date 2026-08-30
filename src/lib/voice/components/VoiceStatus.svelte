<script lang="ts">
  import { voiceStatusStore, voiceSettingsStore } from '../voice-store';
  import { Mic, MicOff, Volume2, X, CheckCircle, AlertCircle, Settings } from 'lucide-svelte';

  /**
   * Props
   */
  export let showDetails: boolean = true;
  export let compact: boolean = false;

  let voiceStatus = { microphone: 'idle', isListening: false, isSpeaking: false, available: true, permitted: true, lastError: null };
  let voiceSettings = { enabled: true };

  // S'abonner aux stores
  voiceStatusStore.subscribe((value) => {
    voiceStatus = value;
  });

  voiceSettingsStore.subscribe((value) => {
    voiceSettings = value;
  });

  /**
   * Statuts
   */
  const statusConfig = {
    idle: { icon: Mic, color: 'text-muted-foreground', label: 'Ready' },
    listening: { icon: Mic, color: 'text-primary', label: 'Listening' },
    processing: { icon: Volume2, color: 'text-primary', label: 'Processing' },
    speaking: { icon: Volume2, color: 'text-accent', label: 'Speaking' },
    muted: { icon: MicOff, color: 'text-muted-foreground', label: 'Muted' },
    error: { icon: AlertCircle, color: 'text-destructive', label: 'Error' },
    unavailable: { icon: X, color: 'text-muted-foreground', label: 'Unavailable' },
    denied: { icon: AlertCircle, color: 'text-destructive', label: 'Denied' },
  };

  const currentStatus = computed(() => {
    if (!voiceSettings.enabled) return 'unavailable';
    if (!voiceStatus.available) return 'unavailable';
    if (voiceStatus.microphone === 'denied') return 'denied';
    if (voiceStatus.microphone === 'error') return 'error';
    if (voiceStatus.isListening) return 'listening';
    if (voiceStatus.isSpeaking) return 'speaking';
    return voiceStatus.microphone || 'idle';
  });

  const status = computed(() => statusConfig[currentStatus() as keyof typeof statusConfig] || statusConfig.idle);
</script>

<div class="flex items-center gap-2 {compact ? 'p-1' : 'p-2'} rounded-lg {voiceStatus.available ? 'bg-muted' : 'bg-destructive/10'}">
  <status.icon size={compact ? 14 : 16} class={status().color} />
  
  {#if !compact}
    <span class="text-sm {status().color}">
      {status().label}
    </span>
  {/if}
  
  {#if showDetails && !compact}
    <div class="flex items-center gap-2 ml-auto">
      {#if voiceStatus.lastError}
        <span class="text-xs text-destructive truncate max-w-[200px]" title={voiceStatus.lastError}>
          {voiceStatus.lastError}
        </span>
      {/if}
      
      {#if !voiceSettings.enabled}
        <span class="text-xs text-muted-foreground">Disabled</span>
      {/if}
      
      {#if !voiceStatus.available}
        <span class="text-xs text-muted-foreground">Not available</span>
      {/if}
      
      {#if !voiceStatus.permitted}
        <span class="text-xs text-muted-foreground">No permission</span>
      {/if}
    </div>
  {/if}
</div>
