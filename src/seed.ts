import { auth } from "./config/auth.js";
import prisma from "./config/prisma.js";

async function seed() {
    console.log("🌱 Seeding database...");

    try {
        // 1. Create Client
        console.log("Creating Demo Client...");
        await auth.api.signUpEmail({
            body: {
                email: "client@demo.com",
                password: "password123",
                name: "Demo Client",
            }
        }).catch(() => console.log("Client already exists, skipping..."));

        await prisma.user.update({
            where: { email: "client@demo.com" },
            data: { role: "CLIENT", isOnboarded: true }
        });

        // 2. Create Strategic Demo Freelancer
        console.log("Creating NexusMarket Demo Freelancer...");
        await auth.api.signUpEmail({
            body: {
                email: "demo@nexusmarket.ai",
                password: "password123",
                name: "Strategic Architect",
            }
        }).catch(() => console.log("Demo Freelancer already exists, skipping..."));
        await prisma.user.update({
            where: { email: "demo@nexusmarket.ai" },
            data: {
                role: "FREELANCER",
                isOnboarded: true,
                serviceType: "Elite Solutions Architect",
                bio: "Crafting strategic technical legacies with architectural precision and high-impact delivery.",
                location: "Remote / Strategic Hub",
                hourlyRate: 150
            }
        });

        // 3. Create Standard Demo Freelancer
        console.log("Creating Demo Freelancer...");
        await auth.api.signUpEmail({
            body: {
                email: "freelancer@demo.com",
                password: "password123",
                name: "Demo Freelancer",
            }
        }).catch(() => console.log("Freelancer already exists, skipping..."));
        await prisma.user.update({
            where: { email: "freelancer@demo.com" },
            data: {
                role: "FREELANCER",
                isOnboarded: true,
                firstName: "Demo",
                lastName: "Freelancer",
                serviceType: "Full-stack Developer",
                bio: "Expert in Next.js and Node.js",
                location: "Dhaka, Bangladesh",
                hourlyRate: 35
            }
        });

        // 3. Create Super Admin
        console.log("Creating Demo Super Admin...");
        await auth.api.signUpEmail({
            body: {
                email: "admin@demo.com",
                password: "password123",
                name: "Super Admin",
            }
        }).catch(() => console.log("Admin already exists, skipping..."));

        await prisma.user.update({
            where: { email: "admin@demo.com" },
            data: { role: "SUPER_ADMIN", isOnboarded: true }
        });

        // 4. Create Demo Projects
        console.log("Creating Demo Projects...");
        const client = await prisma.user.findUnique({ where: { email: "client@demo.com" } });

        if (client) {
            const projectsData = [
                {
                    title: "Next.js E-commerce Platform",
                    description: "Looking for an expert to build a full-scale e-commerce platform with Stripe integration and premium UI.",
                    budgetMin: 1500,
                    budgetMax: 3000,
                    category: "Web Development",
                    tags: ["Next.js", "Tailwind", "Stripe", "Prisma"],
                    clientId: client.id
                },
                {
                    title: "Mobile App for Food Delivery",
                    description: "Need a React Native expert to develop a food delivery app with real-time tracking features.",
                    budgetMin: 2000,
                    budgetMax: 5000,
                    category: "Mobile Apps",
                    tags: ["React Native", "Socket.io", "Google Maps"],
                    clientId: client.id
                },
                {
                    title: "AI Chatbot Integration",
                    description: "Implement a sophisticated AI chatbot using OpenAI GPT-4 for our customer support portal.",
                    budgetMin: 500,
                    budgetMax: 1200,
                    category: "AI & Data",
                    tags: ["AI", "OpenAI", "Node.js"],
                    clientId: client.id
                }
            ];

            const createdProjects = [];
            for (const p of projectsData) {
                const project = await prisma.project.create({
                    data: p
                });
                createdProjects.push(project);
            }

            // 5. Create Demo Bids
            console.log("Creating Demo Bids...");
            const freelancer = await prisma.user.findUnique({ where: { email: "freelancer@demo.com" } });
            if (freelancer && createdProjects.length > 0) {
                for (const project of createdProjects) {
                    await prisma.bid.create({
                        data: {
                            amount: project.budgetMin + 200,
                            coverLetter: "I have extensive experience in this field and can deliver high-quality results within the deadline. Let's discuss your architectural vision.",
                            deliveryDays: 14,
                            projectId: project.id,
                            freelancerId: freelancer.id,
                            status: 'PENDING'
                        }
                    });
                }
            }
        }

        console.log("✅ Seeding completed successfully!");
    } catch (error) {
        console.error("❌ Seeding failed:", error);
    } finally {
        await prisma.$disconnect();
        process.exit();
    }
}

seed();
