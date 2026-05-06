import { NextResponse } from 'next/server';

// Tamil Nadu-specific holidays NOT covered by the festivals API
const TAMIL_NADU_SPECIFIC = [
  { name: 'Thiruvalluvar Day', month: 1, date: 15 },
  { name: 'Uzhavar Thirunal', month: 1, date: 16 },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') || 'IN';
  const subdivision = searchParams.get('subdivision') || '';

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  try {
    const allHolidays: any[] = [];

    for (const y of years) {
      const url = `https://indian-festivals-api.onrender.com/api/v1/festivals/${y}`;

      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();

          if (data.festivals) {
            const monthMap: { [key: string]: number } = {
              January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
              July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
            };

            for (const [monthName, festivals] of Object.entries(data.festivals)) {
              const month = monthMap[monthName];
              for (const f of festivals as any[]) {
                const dateStr = `${y}-${String(month).padStart(2, '0')}-${String(f.date).padStart(2, '0')}`;

                const isGovernmentHoliday = isGovernmentHolidayName(f.name);

                allHolidays.push({
                  id: `festival_${y}_${month}_${f.date}_${f.name.replace(/\s+/g, '_')}`,
                  name: f.name,
                  date: dateStr,
                  type: isGovernmentHoliday ? 'government' : 'observance',
                });
              }
            }
          }
        }
      } catch (e) {
        console.error(`Error fetching festivals for ${y}:`, e);
      }
    }

    if (subdivision === 'TN' || country === 'IN') {
      for (const y of years) {
        for (const tnHoliday of TAMIL_NADU_SPECIFIC) {
          const dateStr = `${y}-${String(tnHoliday.month).padStart(2, '0')}-${String(tnHoliday.date).padStart(2, '0')}`;
          const existingIndex = allHolidays.findIndex(h => h.date === dateStr);
          if (existingIndex === -1) {
            allHolidays.push({
              id: `tn_${y}_${tnHoliday.name.replace(/\s+/g, '_')}`,
              name: tnHoliday.name,
              date: dateStr,
              type: 'government',
            });
          }
        }
      }
    }

    allHolidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(allHolidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
  }
}

function isGovernmentHolidayName(name: string): boolean {
  const govHolidays = [
    'New Year', 'Republic Day', 'Independence Day', 'Gandhi Jayanti',
    'Christmas', 'May Day', 'Labour Day', 'Pongal', 'Tamil New Year',
  ];
  return govHolidays.some(h => name.toLowerCase().includes(h.toLowerCase()));
}