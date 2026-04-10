import type { PhotoMeta } from '@/types/photo';

export function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Incrementally update a shuffled photo list by removing deleted photos
 * and inserting new ones near the start (visible area), preserving existing order.
 *
 * @param visibleCount - how many items are roughly visible on screen (default 5).
 *   New photos are inserted within this range so users see them appear.
 */
export function diffPhotos(
    existing: PhotoMeta[],
    incoming: PhotoMeta[],
    visibleCount = 5
): PhotoMeta[] {
    const incomingKeys = new Set(incoming.map(p => p.key));
    const existingKeys = new Set(existing.map(p => p.key));

    // Remove deleted photos
    const kept = existing.filter(p => incomingKeys.has(p.key));

    // Insert new photos within the visible range so users see them appear
    const added = incoming.filter(p => !existingKeys.has(p.key));
    const insertRange = Math.min(visibleCount, kept.length + 1);
    for (const photo of added) {
        const idx = Math.floor(Math.random() * insertRange);
        kept.splice(idx, 0, photo);
    }

    return kept;
}
