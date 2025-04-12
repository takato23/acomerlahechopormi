-- Migración para crear la función RPC get_most_common_recipes
-- Referencias: recipe_generation_enhancement_plan.md

CREATE OR REPLACE FUNCTION get_most_common_recipes(
    p_user_id UUID,
    p_meal_type meal_type DEFAULT NULL,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    recipe_id UUID,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        rh.recipe_id,
        COUNT(*) AS count
    FROM
        public.recipe_history rh
    WHERE
        rh.user_id = p_user_id
        AND (p_meal_type IS NULL OR rh.meal_type = p_meal_type)
    GROUP BY
        rh.recipe_id
    ORDER BY
        count DESC
    LIMIT
        p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Otorgar permisos a los roles necesarios (ej. authenticated)
GRANT EXECUTE ON FUNCTION get_most_common_recipes(UUID, meal_type, INTEGER) TO authenticated;

-- Comentarios para documentación
COMMENT ON FUNCTION get_most_common_recipes(UUID, meal_type, INTEGER) 
IS 'Obtiene las recetas más frecuentemente planificadas por un usuario, opcionalmente filtradas por tipo de comida.';