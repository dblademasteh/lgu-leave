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

  await prisma.holiday.createMany({
    data: [
      { date: new Date(`${year}-01-01`), name: 'New Year' },
      { date: new Date(`${year}-12-25`), name: 'Christmas' }
    ],
    skipDuplicates: true
  });

  console.log('Seeded', emp);
}

main().finally(() => prisma.$disconnect());
