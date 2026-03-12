import prisma from "$lib/db";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { Prisma } from "../../../generated/prisma/client";
import { seedWords } from "../../../seed/seedWords";

export const load: PageServerLoad = async () => {
  const units = await prisma.unit.findMany();
  return { units };
};

export const actions: Actions = {
  createUnit: async ({ request }) => {
    const data = await request.formData();

    const unit = data.get("unit");
    const title = data.get("title");
    const description = data.get("description");

    if (!unit || !title) {
      return fail(400, {
        error: "Unit number and title are required.",
      });
    }

    try {
      await prisma.unit.create({
        data: {
          number: parseInt(unit.toString()),
          title: title.toString(),
          description: description ? description.toString() : null,
        },
      });

      return {
        success: true,
        message: "Unit created successfully!",
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return fail(400, {
            error: "A unit with this number already exists.",
          });
        }
      }

      console.error("Database error creating unit:", error);
      return fail(500, {
        error: "An unexpected database error occurred.",
      });
    }
  },
  deleteUnit: async ({ request }) => {
    const data = await request.formData();
    const id = data.get("id");

    if (!id) {
      return fail(400, { error: "Unit ID is required." });
    }

    try {
      await prisma.unit.delete({
        where: { id: parseInt(id.toString()) },
      });

      return {
        success: true,
        message: "Unit deleted successfully!",
      };
    } catch (error) {
      console.error("Database error deleting unit:", error);
      return fail(500, {
        error: "An unexpected database error occurred while deleting.",
      });
    }
  },
  seedUnit: async ({ request }) => {
    const data = await request.formData();
    const id = data.get("id");

    seedWords();
  },
} satisfies Actions;
