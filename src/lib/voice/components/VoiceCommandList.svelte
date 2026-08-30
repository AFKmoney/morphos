<script lang="ts">
  import { voiceCommandsStore } from '../voice-store';
  import { voiceCommandEngine } from '../voice-engine';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Switch } from '$lib/components/ui/switch';
  import { MoreVertical, Edit, Trash2, PlayCircle, StopCircle } from 'lucide-svelte';
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '$lib/components/ui/dropdown-menu';
  import type { VoiceCommand } from '../voice-types';

  /**
   * Props
   */
  export let category: string | null = null;
  export let search: string = '';
  export let showActions: boolean = true;

  let commands: VoiceCommand[] = [];
  let filteredCommands: VoiceCommand[] = [];

  // S'abonner au store
  voiceCommandsStore.subscribe((value) => {
    commands = value;
    filterCommands();
  });

  // Filtrer les commandes
  function filterCommands() {
    filteredCommands = commands.filter(command => {
      if (category && command.category !== category) return false;
      if (search && !command.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }

  // Mettre à jour la recherche
  function handleSearch(e: Event) {
    search = (e.target as HTMLInputElement).value;
    filterCommands();
  }

  // Toggle une commande
  function toggleCommand(commandId: string) {
    voiceCommandEngine.toggleCommand(commandId, !commands.find(c => c.id === commandId)?.enabled);
  }

  // Exécuter une commande
  async function executeCommand(commandId: string) {
    const command = commands.find(c => c.id === commandId);
    if (!command) return;

    const transcription = {
      text: command.name,
      confidence: 1,
      confidenceLevel: 'very-high' as const,
      language: 'en-US',
      startTime: Date.now(),
      endTime: Date.now(),
      words: [],
    };

    await voiceCommandEngine.executeCommand(commandId, transcription);
  }
</script>

<div class="space-y-4">
  <!-- Search -->
  <div class="relative">
    <input
      type="text"
      placeholder="Search commands..."
      value={search}
      on:input={handleSearch}
      class="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
    />
    <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24">
      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </div>

  <!-- Command List -->
  <div class="space-y-2">
    {#if filteredCommands.length === 0}
      <Card>
        <CardContent class="p-6">
          <p class="text-center text-muted-foreground">No commands found</p>
        </CardContent>
      </Card>
    {:else}
      {#each filteredCommands as command}
        <Card>
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Switch
                  checked={command.enabled}
                  onchange={() => toggleCommand(command.id)}
                />
                <div>
                  <CardTitle class="text-base">{command.name}</CardTitle>
                  <CardDescription class="text-sm">{command.description}</CardDescription>
                </div>
              </div>
              
              {#if showActions}
                <div class="flex items-center gap-2">
                  <Badge variant="outline" class="text-xs">
                    {command.category}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" class="h-8 w-8">
                        <MoreVertical class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onclick={() => executeCommand(command.id)}>
                        <PlayCircle class="h-4 w-4 mr-2" />
                        Execute
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit class="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem class="text-destructive">
                        <Trash2 class="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              {/if}
            </div>
          </CardHeader>
          
          <CardContent class="pt-0">
            <div class="flex flex-wrap gap-1">
              {#each command.triggers as trigger}
                <Badge variant="secondary" class="text-xs">
                  {trigger.pattern}
                </Badge>
              {/each}
            </div>
            
            {#if command.examples && command.examples.length > 0}
              <div class="mt-2">
                <p class="text-sm text-muted-foreground">Examples:</p>
                <ul class="list-disc list-inside text-sm text-muted-foreground mt-1">
                  {#each command.examples as example}
                    <li>{example}</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </CardContent>
        </Card>
      {/each}
    {/if}
  </div>
</div>
