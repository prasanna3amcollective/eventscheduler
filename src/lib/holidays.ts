// Fetches holidays from Indian Festivals API + Tamil Nadu specific holidays

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
}

export const getHolidays = async (year?: number): Promise<Holiday[]> => {
  if (typeof window === 'undefined') return [];
  const yearParam = year || new Date().getFullYear();

  try {
    const response = await fetch(`/api/holidays?country=IN&subdivision=TN&year=${yearParam}`);
    if (response.ok) {
      const data = await response.json();
      // Filter to only include government/public holidays for calendar display
      return data
        .filter((h: any) => h.type === 'government')
        .map((h: any) => ({
          id: h.id,
          name: h.name,
          date: h.date,
        }));
    }
  } catch (error) {
    console.error('Error fetching holidays:', error);
  }

  // Fallback to empty array if API fails
  return [];
};
