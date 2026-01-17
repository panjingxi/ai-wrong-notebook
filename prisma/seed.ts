import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@localhost';
    const password = '123456';
    const name = 'Admin';

    console.log(`Checking admin user: ${email}...`);

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    let targetUserId: string;

    if (existingUser) {
        console.log(`Admin user already exists. Updating defaults...`);
        await prisma.user.update({
            where: { email },
            data: {
                educationStage: 'junior_high',
                enrollmentYear: 2025,
            }
        });
        targetUserId = existingUser.id;
    } else {
        console.log(`Admin user not found. Creating...`);
        const hashedPassword = await hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'admin',
                isActive: true, // Default active
                educationStage: 'junior_high',
                enrollmentYear: 2025,
            },
        });
        targetUserId = user.id;
        console.log(`Admin user created.`);
    }

    // Default subjects
    const DEFAULT_SUBJECTS = [
        "语文", "数学", "英语", "物理", "化学", "生物", "政治", "历史", "地理"
    ];



    console.log(`Checking subjects for user ${targetUserId}...`);

    // Find existing subjects
    const existingSubjects = await prisma.subject.findMany({
        where: { userId: targetUserId },
        select: { name: true }
    });
    const existingSubjectNames = new Set(existingSubjects.map(s => s.name));

    // Determine subjects to create
    const subjectsToCreate = DEFAULT_SUBJECTS.filter(s => !existingSubjectNames.has(s));

    if (subjectsToCreate.length > 0) {
        console.log(`Creating ${subjectsToCreate.length} missing subjects...`);
        await prisma.subject.createMany({
            data: subjectsToCreate.map(name => ({
                name,
                userId: targetUserId
            }))
        });
        console.log(`Created: ${subjectsToCreate.join(', ')}`);
    } else {
        console.log(`All default subjects already exist.`);
    }

    console.log(`\nSuccess! Admin user ready.`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
