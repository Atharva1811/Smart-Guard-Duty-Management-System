import { generateRosterSchedule } from './scheduler/dutyScheduler.js';

async function main() {
  const dateStr = new Date().toISOString().split('T')[0];
  const result = await generateRosterSchedule(dateStr, []);

  const rosterKeys = Object.keys(result.roster);
  console.log("Roster keys (locations):", rosterKeys);

  const sampleKey = rosterKeys[0];
  console.log(`Sample location roster key=${sampleKey}:`, result.roster[Number(sampleKey)]);
}

main().catch(console.error);
