// The global stylesheet is imported for its side effect (app/layout.tsx). Next only declares
// *.module.css, and TypeScript 6 checks side-effect imports by default (noUncheckedSideEffectImports).
declare module '@/ui/globals.css';
