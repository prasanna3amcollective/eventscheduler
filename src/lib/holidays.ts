// This file contains a hardcoded list of 2026/2027 Government Holidays for Chennai.
// It is designed so that it can easily be replaced by an API call in the future.

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
}

export const getHolidays = async (): Promise<Holiday[]> => {
  // Simulating an API call, replace this with a real fetch later.
  return [
    { id: 'h1', name: 'New Year', date: '2026-01-01' },
    { id: 'h2', name: 'Pongal', date: '2026-01-14' },
    { id: 'h3', name: 'Thiruvalluvar Day', date: '2026-01-15' },
    { id: 'h4', name: 'Uzhavar Thirunal', date: '2026-01-16' },
    { id: 'h5', name: 'Republic Day', date: '2026-01-26' },
    { id: 'h6', name: 'Tamil New Year', date: '2026-04-14' },
    { id: 'h7', name: 'May Day', date: '2026-05-01' },
    { id: 'h8', name: 'Independence Day', date: '2026-08-15' },
    { id: 'h9', name: 'Gandhi Jayanti', date: '2026-10-02' },
    { id: 'h10', name: 'Diwali', date: '2026-11-08' }, // Approximate date for 2026
    { id: 'h11', name: 'Christmas', date: '2026-12-25' },
  ];
};
