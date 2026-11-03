// Messages for the browser speech recognition errors, shared by the microphone button and voice mode.
// Work computers often block the microphone (IT policy) or the browser's speech service (network filtering),
// so those cases say so and suggest another device.

/** Errors that mean listening can't work right now; trying again straight away won't help. */
export const FATAL_SPEECH_ERRORS = new Set(["not-allowed", "service-not-allowed", "audio-capture", "network", "language-not-supported"]);

export function speechErrorMessage(code: string): string | null {
  switch (code) {
    case "aborted":
      return null;
    case "no-speech":
      return "I didn't catch anything. Tap the microphone and try again.";
    case "not-allowed":
    case "service-not-allowed":
      return "The microphone is blocked for this site. Select the icon at the left of the address bar and allow the microphone, then try again. On a work computer, IT settings may block it; your phone or a personal computer should work.";
    case "audio-capture":
      return "No microphone was found. Check that one is connected and not in use by another app (such as Teams or Zoom), then try again.";
    case "network":
      return "Your browser's speech service couldn't be reached. Work networks sometimes block it. Try your phone or another network, or type instead.";
    case "keeps-stopping": // our own code: listening ends the moment it starts, with no error from the browser
      return "Listening keeps stopping as soon as it starts. Your computer or network settings may be blocking speech recognition; work computers often do. Try your phone or a personal computer, or type instead.";
    case "language-not-supported":
      return "Speech isn't available for your browser's language setting. Type instead, or set your browser language to English.";
    default:
      return `The microphone stopped (${code}). Try again, or type instead.`;
  }
}
