import { describe, it, expect } from 'vitest';
import { db } from '../db/database';

describe('Muninn Database Schema', () => {
  it('instantiates Dexie database with correct name', () => {
    expect(db.name).toBe('MuninnDatabase');
  });

  it('defines required tables: decks, cards, and reviewLogs', () => {
    expect(db.decks).toBeDefined();
    expect(db.cards).toBeDefined();
    expect(db.reviewLogs).toBeDefined();
    expect(db.decks.name).toBe('decks');
    expect(db.cards.name).toBe('cards');
    expect(db.reviewLogs.name).toBe('reviewLogs');
  });
});
