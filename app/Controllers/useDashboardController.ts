'use client';

import { useState, useEffect } from 'react';
import { db, Monk, FinancialTransaction, TempleEvent, BorrowRecord, AshesRecord } from '@/lib/db';

export function useDashboardController() {
  const [monks, setMonks] = useState<Monk[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [events, setEvents] = useState<TempleEvent[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [ashes, setAshes] = useState<AshesRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [monksList, transList, eventsList, borrowList, ashesList] = await Promise.all([
        db.monks.list(),
        db.finance.list(),
        db.events.list(),
        db.borrow.list(),
        db.ashes.list()
      ]);
      setMonks(monksList);
      setTransactions(transList);
      setEvents(eventsList);
      setBorrowRecords(borrowList);
      setAshes(ashesList);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Derived Calculations (Business Logic)
  const totalMonks = monks.filter(m => m.status === 'active').length;
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const upcomingEvents = events
    .filter(e => e.status === 'upcoming')
    .slice(0, 3);

  const activeBorrows = borrowRecords
    .filter(b => b.status === 'borrowed' || b.status === 'overdue');

  const recentTransactions = transactions.slice(0, 4);

  return {
    monks,
    transactions,
    events,
    borrowRecords,
    ashes,
    loading,
    totalMonks,
    totalIncome,
    totalExpense,
    netBalance,
    upcomingEvents,
    activeBorrows,
    recentTransactions,
    loadData
  };
}
