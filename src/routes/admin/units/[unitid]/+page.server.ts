import type { PageServerLoad } from "./$types";
import prisma from "$lib/db";

export const load: PageServerLoad = async ({ params }) => {
  const unitId = parseInt(params.unitid);

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: {
      id: true,
      number: true,
      title: true,
      description: true,
    },
  });

  return { unit };
};
