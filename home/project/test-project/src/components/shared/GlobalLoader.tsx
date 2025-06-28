
export default function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="text-5xl font-headline font-black italic tracking-tighter">
          <span className="text-white">Bet</span><span className="text-primary">Nexo</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-primary animate-loader-dot" style={{ animationDelay: '0s' }}></div>
          <div className="h-3 w-3 rounded-full bg-primary animate-loader-dot" style={{ animationDelay: '0.2s' }}></div>
          <div className="h-3 w-3 rounded-full bg-primary animate-loader-dot" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
