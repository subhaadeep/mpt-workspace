export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6'
  return (
    <div className={`${sz} animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-500`} />
  )
}

export function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0f1a]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  )
}
