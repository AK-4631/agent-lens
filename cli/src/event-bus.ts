import type { AgentEvent } from "@agent-lens/core";

type Listener = (event: AgentEvent) => void;

const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

export function publish(event: AgentEvent): void {
    for (const listener of listeners) {
        try {
            listener(event);
        } catch {
            // Never allow a dashboard listener to break collection.
        }
    }
}
