/**
 * Remove presentation-only syntax before assistant text is sent to voice TTS.
 * Keep this deliberately conservative: the LLM prompt is responsible for
 * producing natural spoken prose; this helper strips common UI/markdown leaks.
 */
function toSpeechText(value) {
  if (typeof value !== "string" || !value.trim()) return "";

  let text = value
    // Code blocks, artifacts, and explicit UI payloads are never spoken.
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[(?:POLL|MAP|DOCUMENTS|TOOL|ARTIFACT)[^\]]*\]/gi, " ")
    .replace(/<\/?(?:SchemeCard|StepWalkthrough|[^>]+)>/gi, " ")
    // Markdown links should speak their label, not the raw destination.
    .replace(/\[([^\]]+)\]\((?:https?:\/\/)?[^)]+\)/g, "$1")
    // Remove common markdown line prefixes and formatting delimiters.
    .replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+[.)]\s+)/gm, "")
    .replace(/\*{1,3}|_{1,3}|~~|`/g, "")
    // URLs, emoji, and control characters are poor default TTS input.
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, " ")
    .replace(/\p{Extended_Pictographic}/gu, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/([,.;!?])(?=\S)/g, "$1 ")
    .trim();

  return text;
}

module.exports = { toSpeechText };
