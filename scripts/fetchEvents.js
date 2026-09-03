const fs = require('fs');

async function run() {

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/scheduled-events`,
    {
      headers: {
        Authorization: `Bot ${process.env.TOKEN}`
      }
    }
  );

  const events = await response.json();

  const publicEvents = events
    .filter(event => event.entity_type === 3)
    .map(event => ({
      id: event.id,
      title: event.name,
      date: event.scheduled_start_time,
      location: event.entity_metadata?.location || '',
      description: event.description || ''
    }));

  fs.writeFileSync(
    'events.json',
    JSON.stringify(publicEvents, null, 2)
  );

  console.log(
    `Saved ${publicEvents.length} public events`
  );
}

run();
