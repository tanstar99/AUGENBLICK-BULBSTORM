import Category from '../models/Category.js';

export const seedCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      console.log('Seeding default categories...');
      await Category.seedDefaultCategories();
      console.log('Default categories seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
};
