export interface MessageLike {
  id: string;
  created_at: string;
}

export function normalizeMessages<T extends MessageLike>(messages: T[]): T[] {
  const byId = new Map<string, T>();

  for (const message of messages) {
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const dateDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.id.localeCompare(b.id);
  });
}

export function upsertMessage<T extends MessageLike>(messages: T[], nextMessage: T): T[] {
  return normalizeMessages([...messages.filter((message) => message.id !== nextMessage.id), nextMessage]);
}
