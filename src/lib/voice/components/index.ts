/**
 * Voice UI used to be a pile of .svelte files dropped into a React/Next app
 * by a previous agent. MorphOS has no Svelte runtime.
 *
 * The working voice path is `@/lib/use-voice-input` (Web Speech API) wired
 * into the command dock. These names stay exported as no-ops so leftover
 * imports do not crash the build.
 */

export function VoiceButton() {
  return null;
}
export function VoiceStatus() {
  return null;
}
export function VoiceSettingsDialog() {
  return null;
}
export function VoiceCommandList() {
  return null;
}
export function VoiceTranscriptionDisplay() {
  return null;
}
