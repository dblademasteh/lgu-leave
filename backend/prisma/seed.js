import { PrismaClient, LeaveStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const emp = await prisma.employee.upsert({
    where: { employeeNumber: '1001' },
    update: {},
    create: {
      employeeNumber: '1001',
      fullName: 'Juan Dela Cruz',
      role: 'ADMIN',
      department: 'HR',
      passwordHash
    }
  });

  const vl = await prisma.leaveType.upsert({
    where: { code: 'VL' },
    update: {},
    create: { code: 'VL', name: 'Vacation Leave', defaultDays: 15 }
  });
  const sl = await prisma.leaveType.upsert({
    where: { code: 'SL' },
    update: {},
    create: { code: 'SL', name: 'Sick Leave', defaultDays: 15 }
  });
  const sil = await prisma.leaveType.upsert({
    where: { code: 'SIL' },
    update: {},
    create: { code: 'SIL', name: 'Service Incentive Leave', defaultDays: 5 }
  });
  const maternity = await prisma.leaveType.upsert({
    where: { code: 'MATERNITY' },
    update: {},
    create: { code: 'MATERNITY', name: 'Maternity Leave', defaultDays: 105 }
  });
  const paternity = await prisma.leaveType.upsert({
    where: { code: 'PATERNITY' },
    update: {},
    create: { code: 'PATERNITY', name: 'Paternity Leave', defaultDays: 7 }
  });
  const solo = await prisma.leaveType.upsert({
    where: { code: 'SOLO_PARENT' },
    update: {},
    create: { code: 'SOLO_PARENT', name: 'Solo Parent Leave', defaultDays: 7 }
  });
  const adoption = await prisma.leaveType.upsert({
    where: { code: 'ADOPTION' },
    update: {},
    create: { code: 'ADOPTION', name: 'Adoption Leave', defaultDays: 105 }
  });
  const bereavement = await prisma.leaveType.upsert({
    where: { code: 'BEREAVEMENT' },
    update: {},
    create: { code: 'BEREAVEMENT', name: 'Bereavement Leave', defaultDays: 3 }
  });
  const study = await prisma.leaveType.upsert({
    where: { code: 'STUDY' },
    update: {},
    create: { code: 'STUDY', name: 'Study Leave', defaultDays: 0 }
  });
  const lwop = await prisma.leaveType.upsert({
    where: { code: 'LWOP' },
    update: {},
    create: { code: 'LWOP', name: 'Leave Without Pay', defaultDays: 0 }
  });

  const year = new Date().getFullYear();
  await prisma.leaveBalance.upsert({
    where: { employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId: vl.id, year } },
    update: {},
    create: { employeeId: emp.id, leaveTypeId: vl.id, year, balance: 15, used: 0 }
  });
  await prisma.leaveBalance.upsert({
    where: { employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId: sl.id, year } },
    update: {},
    create: { employeeId: emp.id, leaveTypeId: sl.id, year, balance: 15, used: 0 }
  });
  await prisma.leaveBalance.upsert({
    where: { employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId: sil.id, year } },
    update: {},
    create: { employeeId: emp.id, leaveTypeId: sil.id, year, balance: 5, used: 0 }
  });

  await prisma.holiday.createMany({
    data: [
      { date: new Date(`${year}-01-01`), name: 'New Year' },
      { date: new Date(`${year}-12-25`), name: 'Christmas' }
    ],
    skipDuplicates: true
  });

  // Seed default office hours
  for (let i = 1; i <= 5; i++) {
    await prisma.officeHours.upsert({
      where: { dayOfWeek: i },
      update: {},
      create: { dayOfWeek: i, startTime: '08:00', endTime: '17:00', isWorkDay: true }
    });
  }
  await prisma.officeHours.upsert({
    where: { dayOfWeek: 0 },
    update: {},
    create: { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorkDay: false }
  });
  await prisma.officeHours.upsert({
    where: { dayOfWeek: 6 },
    update: {},
    create: { dayOfWeek: 6, startTime: '00:00', endTime: '00:00', isWorkDay: false }
  });

  // Seed default leave rules
  const leaveCodes = ['VL','SL','SIL','MATERNITY','PATERNITY','SOLO_PARENT','ADOPTION','BEREAVEMENT','STUDY','LWOP'];
  for (const code of leaveCodes) {
    await prisma.leaveRule.upsert({
      where: { leaveTypeCode: code },
      update: {},
      create: { leaveTypeCode: code, maxConsecutiveDays: code==='VL'?15: code==='SL'?15:30, requiresAttachment: code==='MATERNITY'||code==='ADOPTION', notifyDaysBefore: 3 }
    });
  }

  console.log('Seeded', emp);
}

main().finally(() => prisma.$disconnect());
