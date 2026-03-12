import { unitWords } from "./unitData/lekcia1";
import prisma from "$lib/db";

export const seedWords = () => {
  unitWords.forEach(async (word) => {
    try {
      await prisma.word.create({
        data: {
          slovak: word.slovak,
          german: word.german,
          unitId: 4,
          wordType: word.wordType,
          gender: word.gender,
          plural: word.plural,
        },
      });
    } catch (error) {
      console.error(`Error creating word: ${word.slovak}`, error);
    }
  });
};
