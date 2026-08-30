<script lang="ts">
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Switch } from '$lib/components/ui/switch';
  import { Slider } from '$lib/components/ui/slider';
  import { Settings, Mic, Volume2, Globe, Keyboard, AlertCircle } from 'lucide-svelte';
  import { voiceSettingsStore, voiceStatusStore, getAllVoices, loadVoices } from '../voice-store';
  import type { VoiceSettings } from '../voice-types';

  /**
   * Props
   */
  export let trigger: Snippet | undefined = undefined;
  export let open: boolean = false;

  let settings: VoiceSettings = { enabled: true };
  let voices: SpeechSynthesisVoice[] = [];
  let isLoading = false;
  let error: string | null = null;

  // S'abonner au store
  voiceSettingsStore.subscribe((value) => {
    settings = value;
  });

  // Charger les voix
  onMount(async () => {
    isLoading = true;
    try {
      voices = await loadVoices();
    } catch {
      error = 'Failed to load voices';
    } finally {
      isLoading = false;
    }
  });

  /**
   * Actions
   */
  function updateSettings(updates: Partial<VoiceSettings>) {
    voiceSettingsStore.update(current => ({ ...current, ...updates }));
  }

  function resetSettings() {
    updateSettings({
      enabled: true,
      activationShortcut: 'Ctrl+Shift+Space',
      stopShortcut: 'Ctrl+Shift+Escape',
      microphoneSensitivity: 0.8,
      noiseSuppression: true,
      echoCancellation: true,
      recognition: {
        defaultLanguage: 'en-US',
        defaultModel: 'web-speech-api',
        continuous: false,
        maxDuration: 60000,
        silenceThreshold: 3000,
        filterProfanity: true,
        includeWordTimestamps: false,
        maxAlternatives: 1,
      },
      synthesis: {
        defaultVoice: '',
        defaultRate: 1,
        defaultPitch: 1,
        defaultVolume: 1,
        defaultLang: 'en-US',
      },
    });
  }

  function testMicrophone() {
    voiceStatusStore.update(status => ({ ...status, microphone: 'idle' }));
    // À implémenter
  }

  function testSpeech() {
    // À implémenter
  }
</script>

<Dialog {open}>
  {#if trigger}
    <DialogTrigger asChild>
      {@render trigger()}
    </DialogTrigger>
  {:else}
    <DialogTrigger asChild>
      <Button variant="outline" size="icon">
        <Settings class="h-4 w-4" />
      </Button>
    </DialogTrigger>
  {/if}
  
  <DialogContent class="max-w-2xl">
    <DialogHeader>
      <DialogTitle class="flex items-center gap-2">
        <Settings class="h-5 w-5" />
        Voice Settings
      </DialogTitle>
      <DialogDescription>
        Configure voice recognition and text-to-speech settings
      </DialogDescription>
    </DialogHeader>

    {#if error}
      <div class="p-4 bg-destructive/10 rounded-lg border border-destructive flex items-center gap-2">
        <AlertCircle class="h-4 w-4 text-destructive" />
        <span class="text-sm text-destructive">{error}</span>
      </div>
    {/if}

    <div class="space-y-6">
      <!-- Enable/Disable -->
      <div class="space-y-2">
        <Label class="flex items-center gap-2">
          <Switch
            checked={settings.enabled}
            onchange={(e) => updateSettings({ enabled: e.target.checked })}
          />
          Enable Voice Commands
        </Label>
        <p class="text-sm text-muted-foreground">
          Enable or disable voice command functionality globally
        </p>
      </div>

      <!-- Recognition Settings -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <Mic class="h-5 w-5" />
          Recognition
        </h3>

        <div class="space-y-2">
          <Label for="language">Language</Label>
          <Select
            value={settings.recognition?.defaultLanguage || 'en-US'}
            onValueChange={(value) => updateSettings({
              recognition: { ...settings.recognition, defaultLanguage: value }
            })}
          >
            <SelectTrigger id="language" class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en-US">English (US)</SelectItem>
              <SelectItem value="en-GB">English (UK)</SelectItem>
              <SelectItem value="fr-FR">French</SelectItem>
              <SelectItem value="de-DE">German</SelectItem>
              <SelectItem value="es-ES">Spanish</SelectItem>
              <SelectItem value="it-IT">Italian</SelectItem>
              <SelectItem value="pt-BR">Portuguese (Brazil)</SelectItem>
              <SelectItem value="ru-RU">Russian</SelectItem>
              <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
              <SelectItem value="ja-JP">Japanese</SelectItem>
              <SelectItem value="ko-KR">Korean</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="model">Recognition Model</Label>
          <Select
            value={settings.recognition?.defaultModel || 'web-speech-api'}
            onValueChange={(value) => updateSettings({
              recognition: { ...settings.recognition, defaultModel: value }
            })}
          >
            <SelectTrigger id="model" class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="web-speech-api">Web Speech API (Browser)</SelectItem>
              <SelectItem value="whisper">Whisper (Local)</SelectItem>
              <SelectItem value="google">Google Speech-to-Text</SelectItem>
              <SelectItem value="azure">Azure Speech Services</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label class="flex items-center gap-2">
            <Switch
              checked={settings.recognition?.continuous || false}
              onchange={(e) => updateSettings({
                recognition: { ...settings.recognition, continuous: e.target.checked }
              })}
            />
            Continuous Listening
          </Label>
          <p class="text-sm text-muted-foreground">
            Keep listening even after speech is detected
          </p>
        </div>

        <div class="space-y-2">
          <Label for="sensitivity">Microphone Sensitivity</Label>
          <Slider
            id="sensitivity"
            value={[settings.microphoneSensitivity * 100]}
            onValueChange={(value) => updateSettings({ microphoneSensitivity: value[0] / 100 })}
            min={0}
            max={100}
            step={1}
          />
          <p class="text-sm text-muted-foreground">
            {Math.round(settings.microphoneSensitivity * 100)}%
          </p>
        </div>

        <div class="flex gap-2">
          <Button variant="outline" size="sm" onclick={testMicrophone}>
            <Mic class="h-4 w-4 mr-2" />
            Test Microphone
          </Button>
        </div>
      </div>

      <!-- Synthesis Settings -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <Volume2 class="h-5 w-5" />
          Text-to-Speech
        </h3>

        <div class="space-y-2">
          <Label for="voice">Voice</Label>
          <Select
            value={settings.synthesis?.defaultVoice || ''}
            onValueChange={(value) => updateSettings({
              synthesis: { ...settings.synthesis, defaultVoice: value }
            })}
          >
            <SelectTrigger id="voice" class="w-full">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              {#each voices as voice}
                <SelectItem value={voice.name}>{voice.name} ({voice.lang})</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="rate">Speech Rate</Label>
          <Slider
            id="rate"
            value={[settings.synthesis?.defaultRate || 1]}
            onValueChange={(value) => updateSettings({
              synthesis: { ...settings.synthesis, defaultRate: value[0] }
            })}
            min={0.5}
            max={2}
            step={0.1}
          />
          <p class="text-sm text-muted-foreground">
            {settings.synthesis?.defaultRate || 1}x
          </p>
        </div>

        <div class="space-y-2">
          <Label for="pitch">Pitch</Label>
          <Slider
            id="pitch"
            value={[settings.synthesis?.defaultPitch || 1]}
            onValueChange={(value) => updateSettings({
              synthesis: { ...settings.synthesis, defaultPitch: value[0] }
            })}
            min={0.5}
            max={2}
            step={0.1}
          />
          <p class="text-sm text-muted-foreground">
            {settings.synthesis?.defaultPitch || 1}x
          </p>
        </div>

        <div class="space-y-2">
          <Label for="volume">Volume</Label>
          <Slider
            id="volume"
            value={[settings.synthesis?.defaultVolume || 1]}
            onValueChange={(value) => updateSettings({
              synthesis: { ...settings.synthesis, defaultVolume: value[0] }
            })}
            min={0}
            max={1}
            step={0.1}
          />
          <p class="text-sm text-muted-foreground">
            {Math.round((settings.synthesis?.defaultVolume || 1) * 100)}%
          </p>
        </div>

        <div class="flex gap-2">
          <Button variant="outline" size="sm" onclick={testSpeech}>
            <Volume2 class="h-4 w-4 mr-2" />
            Test Speech
          </Button>
        </div>
      </div>

      <!-- Keyboard Shortcuts -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <Keyboard class="h-5 w-5" />
          Keyboard Shortcuts
        </h3>

        <div class="space-y-2">
          <Label for="activation">Activation Shortcut</Label>
          <Input
            id="activation"
            value={settings.activationShortcut}
            onChange={(e) => updateSettings({ activationShortcut: e.target.value })}
            placeholder="Ctrl+Shift+Space"
          />
        </div>

        <div class="space-y-2">
          <Label for="stop">Stop Shortcut</Label>
          <Input
            id="stop"
            value={settings.stopShortcut}
            onChange={(e) => updateSettings({ stopShortcut: e.target.value })}
            placeholder="Ctrl+Shift+Escape"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2">
        <Button variant="outline" onclick={resetSettings}>
          Reset to Defaults
        </Button>
        <DialogClose asChild>
          <Button>Save & Close</Button>
        </DialogClose>
      </div>
    </div>
  </DialogContent>
</Dialog>
