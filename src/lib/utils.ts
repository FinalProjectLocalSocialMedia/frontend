// Single source of truth for class merging: shadcn components import `cn` from the "cn" package,
// so the app code re-exports the same function to avoid having two different implementations.
export { cn } from 'cn'
