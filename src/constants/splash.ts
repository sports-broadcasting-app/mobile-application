// Mirrors the expo-splash-screen plugin config in app.json. The animated
// splash must start pixel-identical to the native one, so these values are
// fixed brand colors, not theme colors.
export const SPLASH_BACKGROUND = '#0f172a';
export const SPLASH_LOGO_SIZE = 240; // app.json → imageWidth

// The white play sits 102px to the right of the green one on the 1024px canvas.
export const SPLASH_FRONT_OFFSET = SPLASH_LOGO_SIZE * (102 / 1024);
