import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data...')
  
  // Seed Categories
  const categories = ['Hardware', 'Software', 'Network', 'Account', 'Other']
  for (const catName of categories) {
    await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: {
        name: catName,
        description: `Support for ${catName} issues`,
      },
    })
  }

  // Seed Admin User
  const adminPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@helpdesk.local' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@helpdesk.local',
      password_hash: adminPassword,
      role: 'MANAGER',
    },
  })

  // Seed Staff User
  const staffPassword = await bcrypt.hash('staff123', 10)
  await prisma.user.upsert({
    where: { email: 'staff@helpdesk.local' },
    update: {},
    create: {
      name: 'IT Support Staff',
      email: 'staff@helpdesk.local',
      password_hash: staffPassword,
      role: 'STAFF',
    },
  })

  console.log('Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
