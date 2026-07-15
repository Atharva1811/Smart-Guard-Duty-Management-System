// server/prisma/seed.ts
import { PrismaClient, Role, GuardStatus, LeaveStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records (Optional, safe for fresh seed)
  await prisma.auditLog.deleteMany();
  await prisma.assignmentHistory.deleteMany();
  await prisma.dutyAssignment.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.guard.deleteMany();
  await prisma.location.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.holidayCalendar.deleteMany();

  // 2. Create Users
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const supervisorPasswordHash = await bcrypt.hash('super123', 10);

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      name: 'Atharva Deshmukh (Admin)',
      role: Role.ADMIN,
      email: 'admin@smartguard.com',
    },
  });

  const supervisorUser = await prisma.user.create({
    data: {
      username: 'supervisor',
      passwordHash: supervisorPasswordHash,
      name: 'Milind Patil (Supervisor)',
      role: Role.SUPERVISOR,
      email: 'supervisor@smartguard.com',
    },
  });

  console.log(`✅ Created seed users: ${adminUser.username}, ${supervisorUser.username}`);

  // 3. Create Guards
  const guardsData = [
    { guardCode: 'G001', name: 'Ramesh Shinde', gender: 'Male', weeklyOff: 0 },
    { guardCode: 'G002', name: 'Sanjay Patil', gender: 'Male', weeklyOff: 1 },
    { guardCode: 'G003', name: 'Aniket Kadam', gender: 'Male', weeklyOff: 2 },
    { guardCode: 'G004', name: 'Sunil Pawar', gender: 'Male', weeklyOff: 3 },
    { guardCode: 'G005', name: 'Pooja Sawant', gender: 'Female', weeklyOff: 0 },
    { guardCode: 'G006', name: 'Vijay Rane', gender: 'Male', weeklyOff: 4 },
    { guardCode: 'G007', name: 'Rahul More', gender: 'Male', weeklyOff: 5 },
    { guardCode: 'G008', name: 'Snehal Jadhav', gender: 'Female', weeklyOff: 0 },
    { guardCode: 'G009', name: 'Amol Deshmukh', gender: 'Male', weeklyOff: 6 },
    { guardCode: 'G010', name: 'Ganesh Joshi', gender: 'Male', weeklyOff: 1 },
    { guardCode: 'G011', name: 'Dipak Koli', gender: 'Male', weeklyOff: 2 },
    { guardCode: 'G012', name: 'Sandip Patil', gender: 'Male', weeklyOff: 3 },
    { guardCode: 'G013', name: 'Priyanka Shinde', gender: 'Female', weeklyOff: 0 },
    { guardCode: 'G014', name: 'Prasad Rane', gender: 'Male', weeklyOff: 4 },
    { guardCode: 'G015', name: 'Nitin Kadam', gender: 'Male', weeklyOff: 5 },
  ];

  const guards = [];
  for (const g of guardsData) {
    const guard = await prisma.guard.create({
      data: {
        ...g,
        status: GuardStatus.AVAILABLE,
        availability: true,
      },
    });
    guards.push(guard);
  }
  console.log(`✅ Seeded ${guards.length} guards.`);

  // 4. Create Locations
  const locationsData = [
    { locationName: 'Main Gate Checkpoint', requiredGuards: 1, priority: 1, securityLevel: 'High', shift: 'Morning,Evening,Night' },
    { locationName: 'East Gate Checkpoint', requiredGuards: 1, priority: 2, securityLevel: 'Standard', shift: 'Morning,Evening,Night' },
    { locationName: 'Corporate Office Entrance', requiredGuards: 1, priority: 1, securityLevel: 'High', shift: 'Morning,Evening' },
    { locationName: 'Rear Loading Dock', requiredGuards: 1, priority: 2, securityLevel: 'Standard', shift: 'Night' },
    { locationName: 'Parking Garage Area', requiredGuards: 1, priority: 3, securityLevel: 'Low', shift: 'Morning,Evening,Night' },
    { locationName: 'Warehouse Perimeter Guard', requiredGuards: 1, priority: 2, securityLevel: 'Standard', shift: 'Night' },
  ];

  const locations = [];
  for (const l of locationsData) {
    const loc = await prisma.location.create({
      data: {
        ...l,
        status: 'Active',
      },
    });
    locations.push(loc);
  }
  console.log(`✅ Seeded ${locations.length} locations.`);

  // 5. Create Default Settings
  const defaultSettings = {
    shiftTimings: {
      Morning: { start: '06:00', end: '14:00' },
      Evening: { start: '14:00', end: '22:00' },
      Night: { start: '22:00', end: '06:00' },
    },
    rotationRules: {
      maxConsecutiveDuties: 5,
      maxNightShiftsPerWeek: 3,
      restHoursBetweenShifts: 12,
    },
    holidayCalendar: [
      { date: '2026-01-26', name: 'Republic Day' },
      { date: '2026-08-15', name: 'Independence Day' },
      { date: '2026-10-02', name: 'Gandhi Jayanti' },
    ],
  };

  await prisma.setting.create({
    data: {
      key: 'system_config',
      value: JSON.stringify(defaultSettings),
    },
  });
  console.log('✅ Seeded system config settings.');

  // 6. Create initial Holidays
  for (const h of defaultSettings.holidayCalendar) {
    await prisma.holidayCalendar.create({
      data: {
        holidayDate: h.date,
        name: h.name,
      },
    });
  }

  // 7. Seed one leave request for demonstration
  await prisma.leaveRequest.create({
    data: {
      guardId: guards[2].id, // G003
      leaveDate: new Date().toISOString().split('T')[0],
      reason: 'Personal emergency work at home',
      status: LeaveStatus.PENDING,
    },
  });

  console.log('🏁 Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
