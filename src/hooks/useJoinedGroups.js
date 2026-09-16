import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'rspace:joined-groups';

// There's no real signed-in identity in this preview, so "joining" a group
// can't write to group_members (RLS requires auth.uid()). This tracks it
// per-browser in localStorage instead — real enough to navigate you into
// the chatroom and persist across reloads, honest that it isn't a synced
// membership.
function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export default function useJoinedGroups() {
  const [joined, setJoined] = useState(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...joined]));
    } catch {
      // best-effort only
    }
  }, [joined]);

  const join = useCallback((groupId) => {
    setJoined((prev) => new Set(prev).add(groupId));
  }, []);

  const leave = useCallback((groupId) => {
    setJoined((prev) => {
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
  }, []);

  const isJoined = useCallback((groupId) => joined.has(groupId), [joined]);

  return { joined, join, leave, isJoined };
}
