require('dotenv').config();

const fs = require('fs');

function loadMap() {
  return JSON.parse(
    fs.readFileSync('eventMap.json', 'utf8')
  );
}

function saveMap(map) {
  fs.writeFileSync(
    'eventMap.json',
    JSON.stringify(map, null, 2)
  );
}

function loadEvents() {
  return JSON.parse(
    fs.readFileSync('events.json', 'utf8')
  );
}

function saveEvents(events) {
  fs.writeFileSync(
    'events.json',
    JSON.stringify(events, null, 2)
  );
}


const {
  Client,
  GatewayIntentBits
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildScheduledEvents
  ]
});

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('guildScheduledEventCreate', async (event) => {

  console.log(`Event Created: ${event.name}`);

  // Only process Somewhere Else events
  if (event.entityType !== 3) {
    console.log('Ignored: not an External event');
    return;
  }

  const channel = await client.channels.fetch(
    process.env.PUBLIC_EVENTS_CHANNEL_ID
  );

  const start = new Date(
    event.scheduledStartTimestamp
  );

  const message = await channel.send(
`🏍️ **${event.name}**

📅 ${start.toLocaleString()}

📍 ${event.entityMetadata?.location || 'Location TBD'}

${event.description || ''}

✅ RSVP using the Scheduled Event in Discord`
);

const map = loadMap();

map[event.id] = message.id;

saveMap(map);

const events = loadEvents();

events.push({
  id: event.id,
  title: event.name,
  date: event.scheduledStartTimestamp,
  location:
    event.entityMetadata?.location || '',
  description:
    event.description || ''
});

saveEvents(events);

  console.log(
    `Posted ${event.name} to #public-events`
  );

});

client.on(
  'guildScheduledEventUpdate',
  async (oldEvent, newEvent) => {

    try {

      console.log(
        `Event Updated: ${newEvent.name}`
      );

      // Only process Somewhere Else events
      if (newEvent.entityType !== 3) {
        console.log(
          'Ignored: not an External event'
        );
        return;
      }

      const map = loadMap();

      const messageId =
        map[newEvent.id];

      if (!messageId) {

        console.log(
          `No message mapping found for ${newEvent.name}`
        );

        return;
      }

      const channel =
        await client.channels.fetch(
          process.env.PUBLIC_EVENTS_CHANNEL_ID
        );

      const message =
        await channel.messages.fetch(
          messageId
        );

      const start =
        new Date(
          newEvent.scheduledStartTimestamp
        );

      await message.edit(
`🏍️ **${newEvent.name}**

📅 ${start.toLocaleString()}

📍 ${newEvent.entityMetadata?.location || 'Location TBD'}

${newEvent.description || ''}

✅ RSVP using the Scheduled Event in Discord`
      );

      console.log(
        `Updated ${newEvent.name}`
      );

    } catch (err) {

      console.error(
        'Update failed:',
        err.message
      );

    }

});



client.on(
  'guildScheduledEventDelete',
  async (event) => {

    const map = loadMap();

    const messageId =
      map[event.id];

    if (!messageId)
      return;

    const channel =
      await client.channels.fetch(
        process.env.PUBLIC_EVENTS_CHANNEL_ID
      );

    const message =
      await channel.messages.fetch(
        messageId
      );

    await message.delete();

    delete map[event.id];

    saveMap(map);

    console.log(
      `Deleted ${event.name}`
    );

});

client.login(process.env.TOKEN);