const fetch = require('node-fetch');

async function testUpdate() {
  const id = '7b5aa4e1-2da5-41ff-9342-4d584f6f060d';
  const payload = {
    name: "Actor's workshop (updated)",
    leader: "Nemi",
    guide: "Harish",
    observer: "Nitish",
    startDateTime: "2026-05-11T01:30:00.000Z",
    endDateTime: "2026-05-11T03:30:00.000Z",
    duration: 120,
    isRecurring: true,
    recurrenceRule: "DTSTART:20260511T013000Z\nRRULE:FREQ=WEEKLY;BYDAY=SU"
  };

  try {
    const res = await fetch(`http://localhost:3000/api/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

testUpdate();
