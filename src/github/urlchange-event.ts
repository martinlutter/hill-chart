/**
 * Event name dispatched when GitHub's SPA navigation (pushState/replaceState) occurs.
 * Dispatched by either:
 * - pushstate-patch.js (injected into MAIN world via <script> tag)
 * - patchHistoryFirefox() in navigation.ts (Firefox, uses wrappedJSObject)
 */
export const URL_CHANGE_EVENT = 'hill:urlchange'
