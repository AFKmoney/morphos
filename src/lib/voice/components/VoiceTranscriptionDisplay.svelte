<script lang="ts">
  import { voiceTranscriptionStore, voiceStatusStore } from '../voice-store';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Mic, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-svelte';
  import type { VoiceTranscription } from '../voice-types';

  /**
   * Props
   */
  export let showTimestamp: boolean = true;
  export let showConfidence: boolean = true;
  export let compact: boolean = false;

  let transcription: VoiceTranscription | null = null;
  let status = { isListening: false, microphone: 'idle' as const };

  // S'abonner aux stores
  voiceTranscriptionStore.subscribe((value) => {
    transcription = value;
  });

  voiceStatusStore.subscribe((value) => {
    status = value;
  });

  // Calculer la durée
  function getDuration() {
    if (!transcription) return 0;
    return transcription.endTime - transcription.startTime;
  }

  // Formater la durée
  function formatDuration(ms: number) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  // Formater la confiance
  function formatConfidence() {
    if (!transcription) return '';
    
    const confidence = transcription.confidence * 100;
    const level = transcription.confidenceLevel;
    
    let color = 'text-muted-foreground';
    switch (level) {
      case 'very-high': color = 'text-primary'; break;
      case 'high': color = 'text-accent'; break;
      case 'medium': color = 'text-warning'; break;
      case 'low': color = 'text-destructive'; break;
    }
    
    return { value: confidence.toFixed(1), color };
  }

  // Obtenir l'icône de statut
  function getStatusIcon() {
    if (status.isListening) return { icon: Mic, color: 'text-primary' };
    if (!transcription) return { icon: Mic, color: 'text-muted-foreground' };
    
    const confidence = transcription.confidence;
    if (confidence >= 0.8) return { icon: CheckCircle, color: 'text-primary' };
    if (confidence >= 0.5) return { icon: AlertCircle, color: 'text-warning' };
    return { icon: XCircle, color: 'text-destructive' };
  }
</script>

{#if compact}
  <div class="flex items-center gap-2 p-2 rounded-lg bg-muted">
    {#if transcription}
      <span class="text-sm">{transcription.text}</span>
      {#if showConfidence}
        <Badge variant="outline" class={`text-xs ${formatConfidence().color}`}>
          {formatConfidence().value}%
        </Badge>
      {/if}
    {:else}
      <span class="text-sm text-muted-foreground">No transcription yet</span>
    {/if}
  </div>
{:else}
  <Card>
    <CardHeader class="pb-2">
      <div class="flex items-center gap-2">
        <getStatusIcon().icon class="h-5 w-5 {getStatusIcon().color}" />
        <CardTitle class="text-base">
          {#if status.isListening}
            Listening...
          {:else if transcription}
            Transcription
          {:else}
            Voice Input
          {/if}
        </CardTitle>
        
        {#if status.isListening}
          <Badge variant="outline" class="text-xs animate-pulse">
            Live
          </Badge>
        {/if}
      </div>
    </CardHeader>
    
    <CardContent>
      {#if transcription}
        <div class="space-y-4">
          <!-- Text -->
          <div>
            <p class="text-lg font-medium">{transcription.text}</p>
          </div>
          
          <!-- Metadata -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            {#if showTimestamp}
              <div class="flex items-center gap-2">
                <Clock class="h-4 w-4 text-muted-foreground" />
                <span class="text-muted-foreground">
                  {formatDuration(getDuration())}
                </span>
              </div>
            {/if}
            
            {#if showConfidence}
              <div class="flex items-center gap-2">
                <CheckCircle class="h-4 w-4 {formatConfidence().color}" />
                <span class={formatConfidence().color}>
                  {formatConfidence().value}% confidence
                </span>
              </div>
            {/if}
          </div>
          
          <!-- Language -->
          <div class="text-sm">
            <Badge variant="outline">
              {transcription.language}
            </Badge>
          </div>
          
          <!-- Words -->
          {#if transcription.words && transcription.words.length > 0}
            <div class="space-y-2">
              <p class="text-sm font-medium">Word Timestamps:</p>
              <div class="flex flex-wrap gap-1">
                {#each transcription.words as word}
                  <Badge variant="secondary" class="text-xs">
                    {word.word} ({formatDuration(word.endTime - word.startTime)})
                  </Badge>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <p class="text-center text-muted-foreground py-4">
          {#if status.isListening}
            Listening for voice input...
          {:else}
            No transcription yet. Click the voice button to start listening.
          {/if}
        </p>
      {/if}
    </CardContent>
  </Card>
{/if}
