import { pool } from "../database/database.js";

class CategoriesService {
  async getCategories() {
    const query = `
    SELECT id, name
    FROM categories
    ORDER BY name ASC
  `;

    const result = await pool.query(query);
    return result.rows;
  }

  async getSubcategoriesByCategory(categoryId: number) {
    const query = `
    SELECT id, name, category_id
    FROM subcategories
    WHERE category_id = $1
    ORDER BY name ASC
  `;

    const result = await pool.query(query, [categoryId]);
    return result.rows;
  }
}

export { CategoriesService }