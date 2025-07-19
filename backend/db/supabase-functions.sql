-- Inventory Functions
CREATE OR REPLACE FUNCTION add_inventory_item(
  p_item_name TEXT,
  p_quantity INTEGER,
  p_unit TEXT,
  p_min_quantity INTEGER
) RETURNS json AS $$
BEGIN
  RETURN (
    INSERT INTO inventory (item_name, quantity, unit, min_quantity)
    VALUES (p_item_name, p_quantity, p_unit, p_min_quantity)
    RETURNING *
  )::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION bulk_update_inventory(
  items json[]
) RETURNS SETOF inventory AS $$
DECLARE
  item json;
BEGIN
  FOR item IN SELECT * FROM unnest(items)
  LOOP
    UPDATE inventory
    SET quantity = (item->>'quantity')::integer
    WHERE id = (item->>'id')::integer
    RETURNING *;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Analytics Functions
CREATE OR REPLACE FUNCTION get_analytics_overview(
  p_start_date timestamp,
  p_end_date timestamp,
  p_vendor_id integer DEFAULT NULL
) RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_orders', COUNT(DISTINCT o.order_id),
    'total_revenue', COALESCE(SUM(o.total_amount), 0),
    'avg_order_value', COALESCE(AVG(o.total_amount), 0),
    'total_items_sold', COALESCE(SUM(oi.quantity), 0)
  )
  INTO result
  FROM orders o
  LEFT JOIN order_items oi ON o.order_id = oi.order_id
  WHERE o.order_date BETWEEN p_start_date AND p_end_date
    AND (p_vendor_id IS NULL OR o.vendor_id = p_vendor_id);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_sales_by_category(
  p_start_date timestamp,
  p_end_date timestamp,
  p_vendor_id integer DEFAULT NULL
) RETURNS TABLE (
  category_name text,
  total_sales numeric,
  total_items integer,
  avg_price numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.name as category_name,
    COALESCE(SUM(oi.quantity * oi.price_at_order), 0) as total_sales,
    COALESCE(SUM(oi.quantity), 0) as total_items,
    COALESCE(AVG(oi.price_at_order), 0) as avg_price
  FROM categories c
  LEFT JOIN menu_items mi ON c.id = mi.category_id
  LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
  LEFT JOIN orders o ON oi.order_id = o.order_id
  WHERE o.order_date BETWEEN p_start_date AND p_end_date
    AND (p_vendor_id IS NULL OR o.vendor_id = p_vendor_id)
  GROUP BY c.name
  ORDER BY total_sales DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_hourly_sales_distribution(
  p_start_date timestamp,
  p_end_date timestamp,
  p_vendor_id integer DEFAULT NULL
) RETURNS TABLE (
  hour integer,
  order_count bigint,
  total_sales numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM o.order_date)::integer as hour,
    COUNT(DISTINCT o.order_id) as order_count,
    COALESCE(SUM(o.total_amount), 0) as total_sales
  FROM orders o
  WHERE o.order_date BETWEEN p_start_date AND p_end_date
    AND (p_vendor_id IS NULL OR o.vendor_id = p_vendor_id)
  GROUP BY EXTRACT(HOUR FROM o.order_date)
  ORDER BY hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_daily_sales(
  p_start_date timestamp,
  p_end_date timestamp,
  p_vendor_id integer DEFAULT NULL
) RETURNS TABLE (
  date date,
  order_count bigint,
  total_sales numeric,
  avg_order_value numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(o.order_date) as date,
    COUNT(DISTINCT o.order_id) as order_count,
    COALESCE(SUM(o.total_amount), 0) as total_sales,
    COALESCE(AVG(o.total_amount), 0) as avg_order_value
  FROM orders o
  WHERE o.order_date BETWEEN p_start_date AND p_end_date
    AND (p_vendor_id IS NULL OR o.vendor_id = p_vendor_id)
  GROUP BY DATE(o.order_date)
  ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Orders Functions
CREATE OR REPLACE FUNCTION get_vendor_order_stats(
  p_vendor_id integer,
  p_start_date timestamp,
  p_end_date timestamp
) RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_orders', COUNT(DISTINCT order_id),
    'completed_orders', COUNT(DISTINCT CASE WHEN status = 'completed' THEN order_id END),
    'pending_orders', COUNT(DISTINCT CASE WHEN status = 'pending' THEN order_id END),
    'total_revenue', COALESCE(SUM(total_amount), 0),
    'avg_order_value', COALESCE(AVG(total_amount), 0)
  )
  INTO result
  FROM orders
  WHERE vendor_id = p_vendor_id
    AND order_date BETWEEN p_start_date AND p_end_date;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_menu_items_availability(
  items json[]
) RETURNS SETOF menu_items AS $$
DECLARE
  item json;
BEGIN
  FOR item IN SELECT * FROM unnest(items)
  LOOP
    UPDATE menu_items
    SET is_available = (item->>'is_available')::boolean
    WHERE id = (item->>'id')::integer
    RETURNING *;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Customer Insights Functions
CREATE OR REPLACE FUNCTION get_customer_insights(
  p_start_date timestamp,
  p_end_date timestamp,
  p_vendor_id integer DEFAULT NULL
) RETURNS TABLE (
  customer_id integer,
  total_orders bigint,
  total_spent numeric,
  avg_order_value numeric,
  first_order_date timestamp,
  last_order_date timestamp
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.user_id as customer_id,
    COUNT(DISTINCT o.order_id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_spent,
    COALESCE(AVG(o.total_amount), 0) as avg_order_value,
    MIN(o.order_date) as first_order_date,
    MAX(o.order_date) as last_order_date
  FROM orders o
  WHERE o.order_date BETWEEN p_start_date AND p_end_date
    AND (p_vendor_id IS NULL OR o.vendor_id = p_vendor_id)
  GROUP BY o.user_id
  ORDER BY total_spent DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inventory Analytics Functions
CREATE OR REPLACE FUNCTION get_inventory_turnover(
  p_start_date timestamp,
  p_end_date timestamp,
  p_vendor_id integer DEFAULT NULL
) RETURNS TABLE (
  item_id integer,
  item_name text,
  units_sold integer,
  current_stock integer,
  turnover_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as item_id,
    i.item_name,
    COALESCE(SUM(oi.quantity), 0)::integer as units_sold,
    i.quantity as current_stock,
    CASE 
      WHEN i.quantity > 0 THEN 
        COALESCE(SUM(oi.quantity), 0)::numeric / i.quantity
      ELSE 0 
    END as turnover_rate
  FROM inventory i
  LEFT JOIN menu_items mi ON i.id = mi.inventory_item_id
  LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
  LEFT JOIN orders o ON oi.order_id = o.order_id
  WHERE o.order_date BETWEEN p_start_date AND p_end_date
    AND (p_vendor_id IS NULL OR o.vendor_id = p_vendor_id)
  GROUP BY i.id, i.item_name, i.quantity
  ORDER BY turnover_rate DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
