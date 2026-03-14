import type { CommandSuggestion } from '@agentic-scifi/shared-schema';
import { toneForRisk } from '../lib/helpers';

interface CommandSurfaceProps {
  suggestions: CommandSuggestion[];
  onStageCommand: (command: string) => void;
}

export function CommandSurface({ suggestions, onStageCommand }: CommandSurfaceProps) {
  return (
    <div className="panel command-surface">
      <div className="panel-head">
        <div>
          <p className="eyebrow">command surface</p>
          <h2>Suggested actions</h2>
        </div>
      </div>
      <div className="command-list">
        {suggestions.map((suggestion) => (
          <div className="command-card" key={suggestion.command}>
            <div className="run-title">
              <strong>{suggestion.intent}</strong>
              <span className={`chip ${toneForRisk(suggestion.risk)}`}>{suggestion.risk}</span>
            </div>
            <pre className="code-block compact-code">{suggestion.command}</pre>
            <p>{suggestion.explanation}</p>
            <button className="action" type="button" onClick={() => onStageCommand(suggestion.command)}>
              Stage command
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
