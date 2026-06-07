import { supabase } from "../database/database.js";

class CategoriesService {
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getSubcategoriesByCategory(categoryId: number) {
    const { data, error } = await supabase
      .from('subcategories')
      .select('id, name, category_id')
      .eq('category_id', categoryId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

export { CategoriesService };