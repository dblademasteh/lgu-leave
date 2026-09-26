import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../stores/auth.js';

const READ_KEY = 'lgu-leave-notif-read';
const POLL_MS = 60000;
const MAX_DECISIONS = 5;
const MAX_READ_IDS = 200;

function readStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(READ_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function readIds(userId) {
  const list = readStore()[userId];
  return Array.isArray(list) ? new Set(list) : new Set();
}

function persistRead(userId, ids) {
  try {
    const store = readStore();
    store[userId] = [...ids].slice(-MAX_READ_IDS);
    localStorage.setItem(READ_KEY, JSON.stringify(store));
  } catch {}
}

export function timeAgo(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toISOString().slice(0, 10);
}

function period(l) {
  const s = (l.startDate || '').slice(0, 10);
  const e = (l.endDate || '').slice(0, 10);
  return `${s} → ${e} · ${l.days ?? '?'}d`;
}

export function useNotifications() {
  const user = useAuth((s) => s.user);
  const userId = user?.id;
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      return;
    }
    try {
      const { data } = await api.get('/api/v1/leaves');
      const leaves = Array.isArray(data) ? data : [];
      const seen = readIds(userId);

      const actions = leaves
        .filter((l) => l.status === 'PENDING' && l.approvals?.some((a) => !a.decision && a.approverId === userId))
        .map((l) => ({
          id: `action:${l.id}`,
          kind: 'action',
          title: `${l.employee?.fullName ?? 'Employee'} requested ${l.leaveType?.code ?? 'leave'}`,
          detail: period(l),
          href: '/approvals',
          at: l.createdAt,
        }));

      const decisions = leaves
        .filter((l) => l.employeeId === userId && (l.status === 'APPROVED' || l.status === 'REJECTED'))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, MAX_DECISIONS)
        .map((l) => ({
          id: `decision:${l.id}`,
          kind: 'decision',
          title: `${l.leaveType?.code ?? 'Leave'} ${l.status.toLowerCase()}`,
          detail: period(l),
          href: '/my-leaves',
          at: l.updatedAt,
        }));

      const all = [...actions, ...decisions]
        .map((n) => ({ ...n, read: seen.has(n.id) }))
        .sort((a, b) => new Date(b.at) - new Date(a.at));
      setItems(all);
    } catch {
      // Bell must never break the header; fail silent and keep last items.
    }
  }, [userId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const markRead = useCallback(
    (id) => {
      if (!userId) return;
      const seen = readIds(userId);
      seen.add(id);
      persistRead(userId, seen);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [userId]
  );

  const markAllRead = useCallback(() => {
    if (!userId) return;
    const seen = readIds(userId);
    setItems((prev) => {
      prev.forEach((n) => seen.add(n.id));
      persistRead(userId, seen);
      return prev.map((n) => ({ ...n, read: true }));
    });
  }, [userId]);

  return { items, unread: items.filter((n) => !n.read).length, markRead, markAllRead, refresh: load };
}
