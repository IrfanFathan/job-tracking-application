import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.interview.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.profile.deleteMany({});

  const demoUserId = '00000000-0000-0000-0000-000000000001';

  // Seed Demo Profile
  const demoProfile = await prisma.profile.create({
    data: {
      id: demoUserId,
      name: 'Alex Mercer',
      role: 'user',
    },
  });

  console.log(`Created demo profile: ${demoProfile.name} (ID: ${demoProfile.id})`);

  // Seed Applications owned by demoProfile
  const app1 = await prisma.application.create({
    data: {
      user_id: demoUserId,
      app_code: 'APP-001',
      company_name: 'Acme Robotics',
      job_title: 'Embedded Firmware Engineer',
      role_type: 'Full-Time',
      work_mode: 'Hybrid',
      location_details: 'Kochi, Kerala, India',
      salary_range: '₹18L - ₹22L / yr',
      application_date: new Date('2026-08-20'),
      application_source: 'LinkedIn',
      referral_contact: 'Priya Menon',
      status: 'Applied',
      follow_up_date: new Date('2026-09-20'),
      notes: 'Strong focus on C++20 and RTOS performance optimization.',
    },
  });

  const app2 = await prisma.application.create({
    data: {
      user_id: demoUserId,
      app_code: 'APP-002',
      company_name: 'Aether Cloud Solutions',
      job_title: 'Senior Backend Engineer',
      role_type: 'Full-Time',
      work_mode: 'Remote',
      location_details: 'Bengaluru, Karnataka, India',
      salary_range: '₹28L - ₹35L / yr',
      application_date: new Date('2026-09-01'),
      application_source: 'Company Portal',
      referral_contact: 'Rohan Sharma',
      status: 'Interviewing',
      follow_up_date: new Date('2026-09-18'),
      notes: 'High throughput distributed systems and Kubernetes infrastructure.',
    },
  });

  const app3 = await prisma.application.create({
    data: {
      user_id: demoUserId,
      app_code: 'APP-003',
      company_name: 'FinTech Neo',
      job_title: 'Full Stack Developer',
      role_type: 'Contract',
      work_mode: 'Remote',
      location_details: 'Mumbai, India',
      salary_range: '$60 / hr',
      application_date: new Date('2026-09-10'),
      application_source: 'Indeed',
      status: 'Screening',
      follow_up_date: new Date('2026-09-22'),
      notes: 'React, Node.js, and PostgreSQL payment gateway modernizations.',
    },
  });

  // Seed Interviews (derived ownership through application_id)
  await prisma.interview.create({
    data: {
      int_code: 'INT-001',
      application_id: app1.id,
      round_type: 'Technical / Coding',
      interview_datetime: new Date('2026-09-25T15:00:00Z'),
      interviewers: 'Arjun Nair - Engineering Manager',
      outcome: 'Pending Feedback',
      thank_you_sent: false,
      prep_notes: 'Review pointer arithmetic, DMA, and concurrency primitives.',
    },
  });

  await prisma.interview.create({
    data: {
      int_code: 'INT-002',
      application_id: app2.id,
      round_type: 'System Design',
      interview_datetime: new Date('2026-09-20T11:00:00Z'),
      interviewers: 'Vikram Patel - Principal Architect',
      outcome: 'Passed',
      thank_you_sent: true,
      feedback: 'Great performance on caching strategies and database partitioning.',
    },
  });

  await prisma.interview.create({
    data: {
      int_code: 'INT-003',
      application_id: app2.id,
      round_type: 'Final Round',
      interview_datetime: new Date('2026-09-28T14:00:00Z'),
      interviewers: 'Meera Das - VP of Engineering',
      outcome: 'Pending Feedback',
      thank_you_sent: false,
      prep_notes: 'Cultural fit and compensation alignment discussion.',
    },
  });

  console.log('Seeding complete successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
