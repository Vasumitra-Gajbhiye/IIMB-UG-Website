import { config } from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";
import {
  PostStatus,
  PrismaClient,
  Role,
  Track,
} from "../src/generated/prisma/client";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const tinyParagraph = (text: string) => [
  {
    id: "seed-block-1",
    type: "paragraph",
    props: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [{ type: "text", text, styles: {} }],
    children: [],
  },
];

async function main() {
  await prisma.allowedEmail.upsert({
    where: { email: "vasumitragajbhiye20@gmail.com" },
    update: { role: Role.SUPER_ADMIN },
    create: {
      email: "vasumitragajbhiye20@gmail.com",
      role: Role.SUPER_ADMIN,
    },
  });

  const students = [
    {
      slug: "aisha-mehta",
      name: "Aisha Mehta",
      track: Track.DATA_SCIENCE,
      bio: "Curious about causal inference and messy real-world datasets.",
      avatarUrl: "/avatars/placeholder-1.svg",
      hometown: "Mumbai",
      previousSchool: "Dhirubhai Ambani International School",
      linkedinUrl: "https://www.linkedin.com/in/example-aisha",
      githubUrl: "https://github.com/example-aisha",
      twitterUrl: null,
      instagramUrl: null,
      websiteUrl: "https://example.com/aisha",
      email: "aisha.mehta@example.com",
      isListed: true,
    },
    {
      slug: "rohan-iyer",
      name: "Rohan Iyer",
      track: Track.DATA_SCIENCE,
      bio: "Building small tools that make campus life slightly less chaotic.",
      avatarUrl: "/avatars/placeholder-2.svg",
      hometown: "Bengaluru",
      previousSchool: "National Public School, Indiranagar",
      linkedinUrl: "https://www.linkedin.com/in/example-rohan",
      githubUrl: "https://github.com/example-rohan",
      twitterUrl: "https://x.com/example_rohan",
      instagramUrl: null,
      websiteUrl: null,
      email: "rohan.iyer@example.com",
      isListed: true,
    },
    {
      slug: "meera-nair",
      name: "Meera Nair",
      track: Track.DATA_SCIENCE,
      bio: null,
      avatarUrl: "/avatars/placeholder-3.svg",
      hometown: null,
      previousSchool: null,
      linkedinUrl: null,
      githubUrl: null,
      twitterUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      email: null,
      isListed: true,
    },
    {
      slug: "kabir-sen",
      name: "Kabir Sen",
      track: Track.ECONOMICS,
      bio: "Interested in development economics and field experiments.",
      avatarUrl: "/avatars/placeholder-4.svg",
      hometown: "Kolkata",
      previousSchool: "La Martiniere for Boys",
      linkedinUrl: "https://www.linkedin.com/in/example-kabir",
      githubUrl: null,
      twitterUrl: null,
      instagramUrl: "https://instagram.com/example_kabir",
      websiteUrl: null,
      email: "kabir.sen@example.com",
      isListed: true,
    },
    {
      slug: "sara-thomas",
      name: "Sara Thomas",
      track: Track.ECONOMICS,
      bio: "Reading about markets, institutions, and why incentives matter.",
      avatarUrl: "/avatars/placeholder-5.svg",
      hometown: "Kochi",
      previousSchool: "Chinmaya Vidyalaya",
      linkedinUrl: null,
      githubUrl: null,
      twitterUrl: null,
      instagramUrl: null,
      websiteUrl: "https://example.com/sara",
      email: "sara.thomas@example.com",
      isListed: true,
    },
    {
      slug: "dev-patel",
      name: "Dev Patel",
      track: Track.ECONOMICS,
      bio: "Still figuring out the minor — open to recommendations.",
      avatarUrl: null,
      hometown: "Ahmedabad",
      previousSchool: null,
      linkedinUrl: "https://www.linkedin.com/in/example-dev",
      githubUrl: null,
      twitterUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      email: null,
      isListed: true,
    },
  ] as const;

  const studentRows = [];
  for (const student of students) {
    const row = await prisma.student.upsert({
      where: { slug: student.slug },
      update: {
        name: student.name,
        track: student.track,
        bio: student.bio,
        avatarUrl: student.avatarUrl,
        hometown: student.hometown,
        previousSchool: student.previousSchool,
        linkedinUrl: student.linkedinUrl,
        githubUrl: student.githubUrl,
        twitterUrl: student.twitterUrl,
        instagramUrl: student.instagramUrl,
        websiteUrl: student.websiteUrl,
        email: student.email,
        isListed: student.isListed,
      },
      create: { ...student },
    });
    studentRows.push(row);
  }

  const aisha = studentRows.find((s) => s.slug === "aisha-mehta")!;
  const kabir = studentRows.find((s) => s.slug === "kabir-sen")!;
  const rohan = studentRows.find((s) => s.slug === "rohan-iyer")!;
  const sara = studentRows.find((s) => s.slug === "sara-thomas")!;

  const resources = [
    {
      idKey: "aisha-pandas-cheatsheet",
      title: "Pandas Cheatsheet",
      url: "https://pandas.pydata.org/Pandas_Cheat_Sheet.pdf",
      description: "Handy reference for everyday data wrangling.",
      sortOrder: 0,
      studentId: aisha.id,
    },
    {
      idKey: "kabir-mankiw-notes",
      title: "Intro Macro Reading List",
      url: "https://www.nber.org/papers",
      description: "A starter set of papers and notes for first-year econ.",
      sortOrder: 0,
      studentId: kabir.id,
    },
  ];

  for (const resource of resources) {
    const existing = await prisma.resource.findFirst({
      where: {
        studentId: resource.studentId,
        title: resource.title,
      },
    });

    if (existing) {
      await prisma.resource.update({
        where: { id: existing.id },
        data: {
          url: resource.url,
          description: resource.description,
          sortOrder: resource.sortOrder,
        },
      });
    } else {
      await prisma.resource.create({
        data: {
          title: resource.title,
          url: resource.url,
          description: resource.description,
          sortOrder: resource.sortOrder,
          studentId: resource.studentId,
        },
      });
    }
  }

  const blogs = [
    {
      slug: "why-we-built-a-batch-site",
      title: "Why we built a batch site",
      excerpt:
        "A short note on making the inaugural cohort easier to find and follow.",
      content: tinyParagraph(
        "This is a student-run site for the inaugural IIMB undergraduate batch. It is not an official admissions portal.",
      ),
      tags: ["batch", "community"],
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-08-01T10:00:00.000Z"),
      authorId: aisha.id,
    },
    {
      slug: "first-week-at-jigani",
      title: "First week at Jigani",
      excerpt: "Campus notes from week one — maps, meals, and meeting people.",
      content: tinyParagraph(
        "Jigani still feels new. The best part so far has been learning names over chai.",
      ),
      tags: ["campus", "life"],
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-08-10T10:00:00.000Z"),
      authorId: kabir.id,
    },
    {
      slug: "notes-on-learning-python",
      title: "Notes on learning Python",
      excerpt: "A draft checklist for classmates starting from scratch.",
      content: tinyParagraph(
        "Start with lists and dictionaries, then move to pandas. Ignore the rest until you need it.",
      ),
      tags: ["data-science", "learning"],
      status: PostStatus.DRAFT,
      publishedAt: null,
      authorId: rohan.id,
    },
    {
      slug: "reading-list-for-september",
      title: "Reading list for September",
      excerpt: "Half-finished thoughts on books worth borrowing from each other.",
      content: tinyParagraph(
        "Still collecting titles. This draft stays private until the list is honest.",
      ),
      tags: ["economics", "books"],
      status: PostStatus.DRAFT,
      publishedAt: null,
      authorId: sara.id,
    },
  ];

  for (const blog of blogs) {
    await prisma.blog.upsert({
      where: { slug: blog.slug },
      update: {
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        tags: [...blog.tags],
        status: blog.status,
        publishedAt: blog.publishedAt,
        authorId: blog.authorId,
      },
      create: {
        slug: blog.slug,
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        tags: [...blog.tags],
        status: blog.status,
        publishedAt: blog.publishedAt,
        authorId: blog.authorId,
      },
    });
  }

  const faqCategoryRows = [
    { name: "General", slug: "general", isDefault: true, sortOrder: 0 },
    { name: "Admissions", slug: "admissions", isDefault: false, sortOrder: 1 },
    { name: "Academics", slug: "academics", isDefault: false, sortOrder: 2 },
    { name: "Campus Life", slug: "campus-life", isDefault: false, sortOrder: 3 },
  ];
  const faqCategoryIds = new Map<string, string>();
  for (const row of faqCategoryRows) {
    const category = await prisma.faqCategory.upsert({
      where: { slug: row.slug },
      create: row,
      update: {},
    });
    faqCategoryIds.set(row.slug, category.id);
  }

  const faqs = [
    {
      question: "Is this the official IIM Bangalore UG admissions site?",
      answer:
        "No. This is a student-run batch project. For official programme and admissions information, visit ug.iimb.ac.in.",
      categorySlug: "admissions",
      sortOrder: 0,
    },
    {
      question: "Where can I find official eligibility and deadlines?",
      answer:
        "Placeholder answer: check the official IIMB UG pages for the latest eligibility criteria, timelines, and application links. We do not invent admissions policy here.",
      categorySlug: "admissions",
      sortOrder: 1,
    },
    {
      question: "What are the two undergraduate majors?",
      answer:
        "B.Sc. (Hons) in Data Science (minor in Economics and Business) and B.Sc. (Hons) in Economics (minor in Data Science and Business).",
      categorySlug: "academics",
      sortOrder: 0,
    },
    {
      question: "How large is the inaugural cohort?",
      answer:
        "About 80 students in AY 2026–27, with roughly 40 per major at the School of Multidisciplinary Studies.",
      categorySlug: "academics",
      sortOrder: 1,
    },
    {
      question: "Where is the undergraduate campus?",
      answer:
        "The inaugural UG cohort is associated with the Jigani campus. Details on facilities may change — treat this as informal batch context, not official housing policy.",
      categorySlug: "campus-life",
      sortOrder: 0,
    },
    {
      question: "Can families visit or contact students through this site?",
      answer:
        "This site shows public student cards and writing when listed. It is not a messaging platform; reach people through the links they choose to share.",
      categorySlug: "campus-life",
      sortOrder: 1,
    },
  ];

  for (const { categorySlug, ...faq } of faqs) {
    const categoryId = faqCategoryIds.get(categorySlug)!;
    const existing = await prisma.faq.findFirst({
      where: { question: faq.question, categoryId },
    });

    if (existing) {
      await prisma.faq.update({
        where: { id: existing.id },
        data: {
          answer: faq.answer,
          sortOrder: faq.sortOrder,
        },
      });
    } else {
      await prisma.faq.create({
        data: { ...faq, categoryId },
      });
    }
  }

  const counts = {
    students: await prisma.student.count(),
    resources: await prisma.resource.count(),
    blogs: await prisma.blog.count(),
    faqs: await prisma.faq.count(),
    allowedEmails: await prisma.allowedEmail.count(),
    users: await prisma.user.count(),
  };

  console.log("Seed complete:", counts);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
