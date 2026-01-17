const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const items = await prisma.errorItem.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { tags: true }
    });

    fs.writeFileSync('db_dump_utf8.json', JSON.stringify(items, null, 2), 'utf8');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
