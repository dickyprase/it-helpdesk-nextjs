import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

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
  await prisma.user.upsert({
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

  // Seed Default Notification Templates
  const templates = [
    {
      event_type: 'ticket_created',
      template_body:
        'Halo [nama-user], tiketmu *[id-ticket]* _[judul-ticket]_ sudah masuk ke sistem.\n\nKategori: *[kategori]*\nStatus: *[status-akhir]*\n\nHarap ditunggu, staff kami akan segera mengatasi keluhanmu.',
      variables: '[id-ticket],[judul-ticket],[kategori],[nama-user],[status-akhir]',
    },
    {
      event_type: 'ticket_assigned',
      template_body:
        'Halo [nama-user], tiketmu *[id-ticket]* _[judul-ticket]_ telah ditugaskan kepada staff kami.\n\nStaff: *[nama-staff]*\nKategori: *[kategori]*\n\nStaff yang ditugaskan akan segera menangani keluhanmu.',
      variables: '[id-ticket],[judul-ticket],[nama-user],[nama-staff],[kategori]',
    },
    {
      event_type: 'ticket_in_progress',
      template_body:
        'Halo [nama-user], tiketmu *[id-ticket]* _[judul-ticket]_ sedang dalam proses penanganan.\n\nDitangani oleh: *[nama-staff]*\nKategori: *[kategori]*\n\nKami sedang bekerja untuk menyelesaikan masalahmu. Mohon ditunggu ya!',
      variables: '[id-ticket],[judul-ticket],[nama-user],[nama-staff],[kategori]',
    },
    {
      event_type: 'ticket_pending',
      template_body:
        'Halo [nama-user], tiketmu *[id-ticket]* _[judul-ticket]_ saat ini dalam status *Pending*.\n\nDitangani oleh: *[nama-staff]*\nKategori: *[kategori]*\n\nTiketmu sedang menunggu respon dari vendor/pihak ketiga. Kami akan segera mengupdate begitu ada perkembangan.',
      variables: '[id-ticket],[judul-ticket],[nama-user],[nama-staff],[kategori]',
    },
    {
      event_type: 'ticket_resolved',
      template_body:
        'Halo [nama-user], tiketmu *[id-ticket]* _[judul-ticket]_ telah diselesaikan oleh staff kami.\n\nDitangani oleh: *[nama-staff]*\nKategori: *[kategori]*\n\nSilakan cek arahan/solusi yang diberikan di dashboard. Jika masih ada kendala, jangan ragu untuk membuat tiket baru.',
      variables: '[id-ticket],[judul-ticket],[nama-user],[nama-staff],[kategori]',
    },
    {
      event_type: 'ticket_closed',
      template_body:
        'Halo [nama-user], tiketmu *[id-ticket]* _[judul-ticket]_ telah ditutup secara resmi.\n\nKategori: *[kategori]*\nStatus Akhir: *[status-akhir]*\n\nTerima kasih telah menggunakan layanan IT Helpdesk. Semoga masalahmu sudah teratasi!',
      variables: '[id-ticket],[judul-ticket],[nama-user],[kategori],[status-akhir]',
    },
    {
      event_type: 'ticket_unclaimed',
      template_body:
        'Halo [nama-user], tiketmu *[id-ticket]* _[judul-ticket]_ telah dilepas oleh staff dan kembali ke status *Terbuka*.\n\nKategori: *[kategori]*\n\nTiket akan segera ditangani oleh staff lain. Mohon ditunggu.',
      variables: '[id-ticket],[judul-ticket],[nama-user],[kategori]',
    },
  ]

  for (const tpl of templates) {
    await prisma.notification_Template.upsert({
      where: { event_type: tpl.event_type },
      update: { template_body: tpl.template_body, variables: tpl.variables },
      create: tpl,
    })
  }

  // Seed WA Settings (if not exists)
  const existingWASetting = await prisma.wA_Setting.findFirst()
  if (!existingWASetting) {
    await prisma.wA_Setting.create({
      data: {
        is_enabled: false,
        connection_status: 'disconnected',
      },
    })
  }

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
