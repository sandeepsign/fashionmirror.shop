interface LoadingModalProps {
  isOpen: boolean;
  progress?: number;
}

export default function LoadingModal({ isOpen, progress = 0 }: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 loading-overlay flex items-center justify-center z-50" data-testid="loading-modal">
      <div className="bg-card rounded-2xl p-8 text-center space-y-6 border border-border shadow-2xl max-w-md mx-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <div className="spinner border-primary"></div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-medium text-foreground" data-testid="text-loading-title">
            AI Magic in Progress
          </h3>
          <p className="text-muted-foreground" data-testid="text-loading-description">
            Our AI is creating your personalized try-on experience...
          </p>
        </div>
        <div className="space-y-2">
          <div className="w-full h-2 bg-border rounded-full">
            <div 
              className="h-2 bg-primary rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
              data-testid="progress-bar"
            />
          </div>
          <p className="text-xs text-muted-foreground" data-testid="text-processing-info">
            Processing with Google Gemini 2.5 Flash Image
          </p>
        </div>
      </div>
    </div>
  );
}
