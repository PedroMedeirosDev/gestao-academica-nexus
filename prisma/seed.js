/**
 * Seed de catálogo alinhado a `docs/specs/catalogo/referencia-matriz-seemg-2026.md`
 * (escopo fechado: EF anos iniciais integral, EF anos finais integral 9 módulos, EM integral propedêutico).
 *
 * Textos de produto **sem** sigla estadual nos nomes exibidos (níveis, disciplinas).
 * Idempotência: se já existir nível `EFAI_EFTI_2026`, assume seed aplicado e não duplica.
 *
 * Executar: `npm run db:seed` (após `npx prisma migrate dev` e `DATABASE_URL` válida).
 */

const { PrismaClient, GradeCreationMode } = require('@prisma/client');

const prisma = new PrismaClient();

function normLabel(s) {
  return String(s)
    .trim()
    .replace(/\s+/g, ' ');
}

/** Disciplinas mestre (união dos currículos; nomes estáveis para deduplicar). */
const DISCIPLINE_NAMES = [
  'Língua Portuguesa',
  'Matemática',
  'Arte',
  'Educação Física',
  'Ciências',
  'Geografia',
  'História',
  'Ensino Religioso',
  'Língua Inglesa',
  'Física',
  'Química',
  'Biologia',
  'Filosofia',
  'Sociologia',
  'Literatura',
];

/** Currículo por série: lista de nomes de disciplina na ordem de exibição (ordem = índice + 1). */
const CURRICULUM_EF_AI = [
  'Língua Portuguesa',
  'Matemática',
  'Arte',
  'Educação Física',
  'Ciências',
  'Geografia',
  'História',
  'Ensino Religioso',
  'Língua Inglesa',
];

const CURRICULUM_EF_AF = [
  'Língua Portuguesa',
  'Matemática',
  'Arte',
  'Educação Física',
  'Ciências',
  'Geografia',
  'História',
  'Ensino Religioso',
  'Língua Inglesa',
  'Física',
  'Química',
  'Biologia',
];

const CURRICULUM_EM = [
  'Língua Portuguesa',
  'Matemática',
  'Literatura',
  'Arte',
  'Educação Física',
  'Língua Inglesa',
  'Filosofia',
  'Sociologia',
  'Biologia',
  'Física',
  'Química',
  'História',
  'Geografia',
];

async function ensureDisciplines() {
  const map = new Map();
  for (const name of DISCIPLINE_NAMES) {
    const n = normLabel(name);
    let row = await prisma.discipline.findFirst({ where: { name: n } });
    if (!row) {
      row = await prisma.discipline.create({ data: { name: n } });
    }
    map.set(n, row.id);
  }
  return map;
}

async function ensureAcademicYear2026() {
  return prisma.academicYear.upsert({
    where: { year: 2026 },
    create: { year: 2026 },
    update: {},
  });
}

async function main() {
  const existing = await prisma.educationLevel.findUnique({
    where: { code: 'EFAI_EFTI_2026' },
  });
  if (existing) {
    console.log(
      '[seed] Catálogo de referência 2026 já existe (nível EFAI_EFTI_2026). Nada a fazer.',
    );
    return;
  }

  const year = await ensureAcademicYear2026();
  const disciplineIds = await ensureDisciplines();

  const templateEfai = [
    { label: '1º ano', sortOrder: 1 },
    { label: '2º ano', sortOrder: 2 },
    { label: '3º ano', sortOrder: 3 },
    { label: '4º ano', sortOrder: 4 },
    { label: '5º ano', sortOrder: 5 },
  ];
  const templateEfaf = [
    { label: '6º ano', sortOrder: 1 },
    { label: '7º ano', sortOrder: 2 },
    { label: '8º ano', sortOrder: 3 },
    { label: '9º ano', sortOrder: 4 },
  ];
  const templateEm = [
    { label: '1ª série', sortOrder: 1 },
    { label: '2ª série', sortOrder: 2 },
    { label: '3ª série', sortOrder: 3 },
  ];

  const efai = await prisma.educationLevel.create({
    data: {
      code: 'EFAI_EFTI_2026',
      name: 'Ensino Fundamental — Anos iniciais (integral, referência 2026)',
      sortOrder: 1,
      gradeCreationMode: GradeCreationMode.FIXED_SERIES,
      fixedSeriesTemplate: templateEfai,
    },
  });

  const efaf = await prisma.educationLevel.create({
    data: {
      code: 'EFAF_EFTI_2026',
      name: 'Ensino Fundamental — Anos finais (integral, referência 2026)',
      sortOrder: 2,
      gradeCreationMode: GradeCreationMode.FIXED_SERIES,
      fixedSeriesTemplate: templateEfaf,
    },
  });

  const em = await prisma.educationLevel.create({
    data: {
      code: 'EM_EMTI_PROP_2026',
      name: 'Ensino Médio — Integral propedêutico (referência 2026)',
      sortOrder: 3,
      gradeCreationMode: GradeCreationMode.FIXED_SERIES,
      fixedSeriesTemplate: templateEm,
    },
  });

  async function seedLevelCurricula(levelId, template, curriculumNames) {
    for (const row of template) {
      const label = normLabel(row.label);
      const grade = await prisma.grade.create({
        data: {
          academicYearId: year.id,
          educationLevelId: levelId,
          label,
          sortOrder: row.sortOrder,
        },
      });

      let order = 1;
      for (const discName of curriculumNames) {
        const id = disciplineIds.get(normLabel(discName));
        if (!id) {
          throw new Error(`Disciplina em falta no mapa: ${discName}`);
        }
        await prisma.gradeCurriculum.create({
          data: {
            gradeId: grade.id,
            disciplineId: id,
            sortOrder: order,
          },
        });
        order += 1;
      }

      await prisma.schoolClass.create({
        data: { gradeId: grade.id, name: normLabel('A') },
      });
      await prisma.schoolClass.create({
        data: { gradeId: grade.id, name: normLabel('B') },
      });
    }
  }

  await seedLevelCurricula(efai.id, templateEfai, CURRICULUM_EF_AI);
  await seedLevelCurricula(efaf.id, templateEfaf, CURRICULUM_EF_AF);
  await seedLevelCurricula(em.id, templateEm, CURRICULUM_EM);

  console.log(
    '[seed] Catálogo 2026 criado: ano letivo, 3 níveis (séries fixas), disciplinas, currículos e turmas A/B por série.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
