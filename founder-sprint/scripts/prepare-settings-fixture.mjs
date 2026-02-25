import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting settings fixture preparation...');

    // Find the test user
    const user = await prisma.user.findUnique({
      where: { email: 'test-founder@example.com' },
      include: {
        experiences: true,
        education: true,
      },
    });

    if (!user) {
      console.error('❌ User not found: test-founder@example.com');
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.email}`);

    // Delete all existing experiences for this user
    await prisma.experience.deleteMany({
      where: { userId: user.id },
    });
    console.log('✓ Deleted existing experiences');

    // Create canonical experiences
    const experience1 = await prisma.experience.create({
      data: {
        userId: user.id,
        company: 'TechCorp',
        title: 'Software Engineer',
        startDate: new Date('2020-01-15'),
        endDate: new Date('2022-06-30'),
        isCurrent: false,
        description: 'Built and maintained web applications',
        location: 'San Francisco, CA',
      },
    });
    console.log('✓ Created Experience 1: TechCorp, Software Engineer');

    const experience2 = await prisma.experience.create({
      data: {
        userId: user.id,
        company: 'StartupAI',
        title: 'Co-Founder & CTO',
        startDate: new Date('2022-07-01'),
        endDate: null,
        isCurrent: true,
        description: 'Leading technical strategy and product development',
        location: 'Seoul, South Korea',
      },
    });
    console.log('✓ Created Experience 2: StartupAI, Co-Founder & CTO');

    // Delete all existing education for this user
    await prisma.education.deleteMany({
      where: { userId: user.id },
    });
    console.log('✓ Deleted existing education records');

    // Create canonical education
    const education1 = await prisma.education.create({
      data: {
        userId: user.id,
        institution: 'Stanford University',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        startYear: 2016,
        endYear: 2020,
      },
    });
    console.log('✓ Created Education: Stanford University, BS in Computer Science');

    // Update user profile fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        location: 'Seoul, South Korea',
        linkedinUrl: 'https://linkedin.com/in/test-founder',
        twitterUrl: 'https://twitter.com/testfounder',
        websiteUrl: 'https://testfounder.com',
        headline: 'Co-Founder & CTO at StartupAI',
      },
    });
    console.log('✓ Updated user profile fields');

    // Verify the fixture
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        experiences: true,
        education: true,
      },
    });

    const experienceCount = updatedUser.experiences.length;
    const educationCount = updatedUser.education.length;

    if (experienceCount !== 2) {
      console.error(`❌ Expected 2 experiences, got ${experienceCount}`);
      process.exit(1);
    }

    if (educationCount !== 1) {
      console.error(`❌ Expected 1 education record, got ${educationCount}`);
      process.exit(1);
    }

    console.log('✓ Verification passed: 2 experiences, 1 education record');
    console.log('\n✅ Settings fixture preparation completed successfully!');
  } catch (error) {
    console.error('❌ Error preparing fixture:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
