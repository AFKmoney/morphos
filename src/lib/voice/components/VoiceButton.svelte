<script lang="ts">
  import type { Snippet } from 'svelte';
  import { voiceSettingsStore, isListeningStore, voiceStatusStore } from '../voice-store';
  import { voiceCommandEngine } from '../voice-engine';
  import { WebSpeechVoiceRecognizer } from '../voice-recognizer';
  import { Microphone, MicOff, Volume2, Settings, AlertCircle } from 'lucide-svelte';

  /**
   * Props
   */
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  export let showLabel: boolean = true;
  export let disabled: boolean = false;
  export let onClick: () => void | undefined = undefined;

  /**
   * Stores
   */
  let isListening = false;
  let voiceSettings = { enabled: true, activationShortcut: '' };
  let voiceStatus = { microphone: 'idle', available: true, permitted: true };
  let error: string | null = null;
  let recognizer: WebSpeechVoiceRecognizer | null = null;

  // S'abonner aux stores
  isListeningStore.subscribe((value) => {
    isListening = value;
  });

  voiceSettingsStore.subscribe((value) => {
    voiceSettings = value;
  });

  voiceStatusStore.subscribe((value) => {
    voiceStatus = value;
  });

  // Initialiser le reconnaisseur
  $: {
    if (typeof window !== 'undefined' && !recognizer) {
      recognizer = new WebSpeechVoiceRecognizer({
        provider: 'web-speech-api',
        language: voiceSettings.recognition?.defaultLanguage || 'en-US',
      });
    }
  }

  // Nettoyer
  onDestroy(() => {
    if (recognizer) {
      recognizer.stop();
      recognizer.cleanup();
    }
  });

  /**
   * Styles
   */
  const buttonClasses = computed(() => {
    const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const sizes = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary',
      ghost: 'bg-transparent text-foreground hover:bg-accent focus:ring-accent',
    };

    const states = {
      listening: 'animate-pulse bg-destructive text-destructive-foreground',
      disabled: 'opacity-50 cursor-not-allowed',
      error: 'bg-destructive text-destructive-foreground',
    };

    let classes = `${base} ${sizes[size]} ${variants[variant]}`;
    
    if (isListening) {
      classes += ' ' + states.listening;
    }
    
    if (disabled || !voiceSettings.enabled || !voiceStatus.available) {
      classes += ' ' + states.disabled;
    }
    
    if (error) {
      classes += ' ' + states.error;
    }

    return classes;
  });

  const iconSize = computed(() => {
    switch (size) {
      case 'sm': return 16;
      case 'md': return 18;
      case 'lg': return 20;
      default: return 18;
    }
  });

  /**
   * Actions
   */
  async function toggleListening() {
    if (disabled || !voiceSettings.enabled || !voiceStatus.available) return;
    
    if (onClick) {
      onClick();
      return;
    }

    if (!recognizer) {
      error = 'Recognizer not initialized';
      return;
    }

    try {
      if (isListening) {
        await recognizer.stop();
        voiceStatusStore.update(status => ({ ...status, isListening: false, microphone: 'idle' }));
      } else {
        // Vérifier les permissions
        if (!voiceStatus.permitted) {
          const permitted = await requestMicrophonePermission();
          if (!permitted) {
            error = 'Microphone access denied';
            return;
          }
        }
        
        error = null;
        await recognizer.start({
          language: voiceSettings.recognition?.defaultLanguage || 'en-US',
          continuous: voiceSettings.recognition?.continuous || false,
        });
        voiceStatusStore.update(status => ({ ...status, isListening: true, microphone: 'listening' }));
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      voiceStatusStore.update(status => ({ ...status, isListening: false, microphone: 'error', lastError: error }));
    }
  }

  /**
   * Demander les permissions du microphone
   */
  async function requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      voiceStatusStore.update(status => ({ ...status, permitted: true }));
      return true;
    } catch {
      voiceStatusStore.update(status => ({ ...status, permitted: false }));
      return false;
    }
  }
</script>

<button
  {disabled}
  onclick={toggleListening}
  class={buttonClasses}
  aria-label="Voice command"
  title="Voice command {isListening ? '(listening)' : '(click to start)'}"
>
  {#if isListening}
    <MicOff size={iconSize} />
  {:else if error}
    <AlertCircle size={iconSize} />
  {:else}
    <Microphone size={iconSize} />
  {/if}
  
  {#if showLabel}
    <span>
      {#if isListening}
        Listening...
      {:else if error}
        Error
      {:else}
        Voice
      {/if}
    </span>
  {/if}
</button>

{#if error}
  <div class="text-destructive text-xs mt-1">{error}</div>
{/if}
