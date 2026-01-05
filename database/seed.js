/**
 * Dating Platform - Database Seeder
 *
 * This script populates the database with sample data for development and testing.
 *
 * Usage:
 *   npx prisma db seed
 *   or
 *   node database/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Sample data generators
const firstNames = {
  female: ['Emma', 'Olivia', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Emily', 'Elizabeth', 'Sofia', 'Avery', 'Ella', 'Scarlett', 'Grace', 'Victoria', 'Riley', 'Aria'],
  male: ['Liam', 'Noah', 'Oliver', 'Elijah', 'William', 'James', 'Benjamin', 'Lucas', 'Henry', 'Alexander', 'Mason', 'Michael', 'Ethan', 'Daniel', 'Jacob', 'Logan', 'Jackson', 'Levi', 'Sebastian', 'Mateo']
};

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

const cities = [
  { city: 'New York', state: 'NY', country: 'USA', lat: 40.7128, lng: -74.0060 },
  { city: 'Los Angeles', state: 'CA', country: 'USA', lat: 34.0522, lng: -118.2437 },
  { city: 'Chicago', state: 'IL', country: 'USA', lat: 41.8781, lng: -87.6298 },
  { city: 'Houston', state: 'TX', country: 'USA', lat: 29.7604, lng: -95.3698 },
  { city: 'Phoenix', state: 'AZ', country: 'USA', lat: 33.4484, lng: -112.0740 },
  { city: 'Philadelphia', state: 'PA', country: 'USA', lat: 39.9526, lng: -75.1652 },
  { city: 'San Antonio', state: 'TX', country: 'USA', lat: 29.4241, lng: -98.4936 },
  { city: 'San Diego', state: 'CA', country: 'USA', lat: 32.7157, lng: -117.1611 },
  { city: 'Dallas', state: 'TX', country: 'USA', lat: 32.7767, lng: -96.7970 },
  { city: 'Miami', state: 'FL', country: 'USA', lat: 25.7617, lng: -80.1918 }
];

const bios = [
  "Adventure seeker and coffee enthusiast. Let's explore the world together!",
  "Dog lover, foodie, and weekend hiker. Looking for my partner in crime.",
  "Tech professional by day, amateur chef by night. Swipe right for home-cooked meals!",
  "Life's too short for bad vibes. Here to find someone who laughs at my jokes.",
  "Bookworm with a love for travel. Tell me about your favorite destination!",
  "Fitness enthusiast and nature lover. Let's grab a smoothie or go for a hike!",
  "Music festival regular and vinyl collector. What's on your playlist?",
  "Aspiring photographer capturing life's beautiful moments. Be my next subject?",
  "Wine lover and amateur sommelier. Let me recommend the perfect pairing.",
  "Yoga practitioner seeking balance and connection. Namaste!"
];

const occupations = ['Software Engineer', 'Marketing Manager', 'Doctor', 'Teacher', 'Designer', 'Entrepreneur', 'Lawyer', 'Financial Analyst', 'Nurse', 'Architect', 'Writer', 'Consultant', 'Product Manager', 'Data Scientist', 'Photographer'];

const interests = ['Travel', 'Fitness', 'Cooking', 'Music', 'Art', 'Photography', 'Hiking', 'Reading', 'Movies', 'Gaming', 'Yoga', 'Dancing', 'Wine Tasting', 'Coffee', 'Dogs', 'Cats', 'Beach', 'Mountains', 'Food', 'Sports'];

// Helper functions
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateAge() {
  return Math.floor(Math.random() * (45 - 21 + 1)) + 21;
}

function generateDateOfBirth(age) {
  const today = new Date();
  const year = today.getFullYear() - age;
  return new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
}

async function main() {
  console.log('Starting database seed...\n');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.activityLog.deleteMany();
  await prisma.dailyStats.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.block.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.message.deleteMany();
  await prisma.match.deleteMany();
  await prisma.like.deleteMany();
  await prisma.profilePrompt.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.prompt.deleteMany();

  // Create subscription plans
  console.log('Creating subscription plans...');
  const plans = await Promise.all([
    prisma.subscriptionPlan.create({
      data: {
        name: 'Basic',
        description: 'Get started with essential features',
        priceMonthly: 9.99,
        priceYearly: 99.99,
        features: ['Unlimited swipes', 'See who likes you', '5 Super Likes per day'],
        swipesPerDay: -1,
        superLikesPerDay: 5,
        boostsPerMonth: 0,
        seeWhoLikes: true,
        sortOrder: 1
      }
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: 'Premium',
        description: 'Enhanced experience with more features',
        priceMonthly: 29.99,
        priceYearly: 299.99,
        features: ['All Basic features', 'Unlimited Super Likes', 'Priority matching', 'Read receipts', '1 Boost per month'],
        swipesPerDay: -1,
        superLikesPerDay: -1,
        boostsPerMonth: 1,
        seeWhoLikes: true,
        readReceipts: true,
        sortOrder: 2
      }
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: 'VIP',
        description: 'Ultimate dating experience',
        priceMonthly: 49.99,
        priceYearly: 499.99,
        features: ['All Premium features', 'Weekly profile boost', 'Incognito mode', 'Advanced filters', 'Priority support', 'See who viewed your profile'],
        swipesPerDay: -1,
        superLikesPerDay: -1,
        boostsPerMonth: 4,
        seeWhoLikes: true,
        readReceipts: true,
        incognitoMode: true,
        advancedFilters: true,
        prioritySupport: true,
        sortOrder: 3
      }
    })
  ]);
  console.log(`Created ${plans.length} subscription plans`);

  // Create prompts
  console.log('Creating profile prompts...');
  const promptsData = [
    { category: 'About Me', text: 'A fact about me that surprises people is...' },
    { category: 'About Me', text: 'I geek out on...' },
    { category: 'About Me', text: 'My most irrational fear is...' },
    { category: 'Dating', text: 'The way to win me over is...' },
    { category: 'Dating', text: 'My ideal first date is...' },
    { category: 'Dating', text: 'I promise I won\'t judge you if...' },
    { category: 'Lifestyle', text: 'A typical Sunday for me is...' },
    { category: 'Lifestyle', text: 'My simple pleasures are...' },
    { category: 'Lifestyle', text: 'I\'m looking for someone who...' }
  ];

  const prompts = await Promise.all(
    promptsData.map(p => prisma.prompt.create({ data: p }))
  );
  console.log(`Created ${prompts.length} prompts`);

  // Create admin user
  console.log('Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@datingplatform.com',
      passwordHash: adminPassword,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    }
  });
  console.log('Admin user created: admin@datingplatform.com / admin123');

  // Create sample users
  console.log('Creating sample users...');
  const users = [];
  const password = await bcrypt.hash('password123', 10);

  for (let i = 0; i < 50; i++) {
    const gender = Math.random() > 0.5 ? 'FEMALE' : 'MALE';
    const genderKey = gender.toLowerCase();
    const firstName = randomElement(firstNames[genderKey]);
    const lastName = randomElement(lastNames);
    const age = generateAge();
    const location = randomElement(cities);

    const user = await prisma.user.create({
      data: {
        email: `user${i + 1}@example.com`,
        passwordHash: password,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        role: 'USER',
        status: 'ACTIVE',
        lastLoginAt: randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()),
        lastActiveAt: randomDate(new Date(Date.now() - 24 * 60 * 60 * 1000), new Date()),
        profile: {
          create: {
            displayName: `${firstName} ${lastName.charAt(0)}.`,
            firstName,
            lastName,
            dateOfBirth: generateDateOfBirth(age),
            gender,
            genderPreference: gender === 'MALE' ? ['FEMALE'] : ['MALE'],
            bio: randomElement(bios),
            occupation: randomElement(occupations),
            interests: randomElements(interests, Math.floor(Math.random() * 5) + 3),
            city: location.city,
            state: location.state,
            country: location.country,
            latitude: location.lat + (Math.random() - 0.5) * 0.5,
            longitude: location.lng + (Math.random() - 0.5) * 0.5,
            height: gender === 'MALE' ? Math.floor(Math.random() * 30) + 165 : Math.floor(Math.random() * 25) + 155,
            completeness: Math.floor(Math.random() * 30) + 70,
            isVerified: Math.random() > 0.3,
            isVisible: true
          }
        }
      },
      include: { profile: true }
    });

    users.push(user);
  }
  console.log(`Created ${users.length} sample users`);

  // Create some matches
  console.log('Creating sample matches...');
  let matchCount = 0;
  for (let i = 0; i < 30; i++) {
    const user1 = users[Math.floor(Math.random() * users.length)];
    const user2 = users[Math.floor(Math.random() * users.length)];

    if (user1.id !== user2.id) {
      try {
        await prisma.match.create({
          data: {
            user1Id: user1.id,
            user2Id: user2.id,
            status: 'ACTIVE',
            matchedAt: randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date())
          }
        });
        matchCount++;
      } catch (e) {
        // Ignore duplicate matches
      }
    }
  }
  console.log(`Created ${matchCount} matches`);

  // Create some likes
  console.log('Creating sample likes...');
  let likeCount = 0;
  for (let i = 0; i < 100; i++) {
    const fromUser = users[Math.floor(Math.random() * users.length)];
    const toUser = users[Math.floor(Math.random() * users.length)];

    if (fromUser.id !== toUser.id) {
      try {
        await prisma.like.create({
          data: {
            fromUserId: fromUser.id,
            toUserId: toUser.id,
            type: Math.random() > 0.9 ? 'SUPER_LIKE' : 'LIKE',
            isRead: Math.random() > 0.5
          }
        });
        likeCount++;
      } catch (e) {
        // Ignore duplicates
      }
    }
  }
  console.log(`Created ${likeCount} likes`);

  // Create some subscriptions
  console.log('Creating sample subscriptions...');
  const subscribedUsers = users.slice(0, 20);
  for (const user of subscribedUsers) {
    const plan = randomElement(plans);
    const startDate = randomDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), new Date());
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate
      }
    });
  }
  console.log(`Created ${subscribedUsers.length} subscriptions`);

  // Create sample daily stats
  console.log('Creating sample daily stats...');
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    await prisma.dailyStats.create({
      data: {
        date,
        newUsers: Math.floor(Math.random() * 50) + 10,
        activeUsers: Math.floor(Math.random() * 500) + 200,
        totalSwipes: Math.floor(Math.random() * 10000) + 5000,
        totalMatches: Math.floor(Math.random() * 200) + 50,
        totalMessages: Math.floor(Math.random() * 5000) + 1000,
        newSubscriptions: Math.floor(Math.random() * 20) + 5,
        revenue: Math.random() * 2000 + 500,
        churnedUsers: Math.floor(Math.random() * 10)
      }
    });
  }
  console.log('Created 31 days of sample stats');

  console.log('\n========================================');
  console.log('Database seeding completed successfully!');
  console.log('========================================');
  console.log('\nSample credentials:');
  console.log('  Admin: admin@datingplatform.com / admin123');
  console.log('  Users: user1@example.com through user50@example.com / password123');
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
