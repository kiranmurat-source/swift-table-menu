-- Feedback → Customers otomatik kayıt trigger'ı
-- Supabase Dashboard > SQL Editor'de çalıştırılacak

CREATE OR REPLACE FUNCTION handle_feedback_customer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_email IS NOT NULL OR NEW.customer_phone IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM customers
      WHERE restaurant_id = NEW.restaurant_id
        AND (
          (NEW.customer_email IS NOT NULL AND email = NEW.customer_email)
          OR (NEW.customer_phone IS NOT NULL AND phone = NEW.customer_phone)
        )
    ) THEN
      UPDATE customers
      SET visit_count = COALESCE(visit_count, 0) + 1,
          last_visit = NOW(),
          updated_at = NOW()
      WHERE restaurant_id = NEW.restaurant_id
        AND (
          (NEW.customer_email IS NOT NULL AND email = NEW.customer_email)
          OR (NEW.customer_phone IS NOT NULL AND phone = NEW.customer_phone)
        );
    ELSE
      INSERT INTO customers (
        restaurant_id, name, email, phone, tags,
        visit_count, last_visit, notes
      )
      VALUES (
        NEW.restaurant_id,
        COALESCE(NEW.customer_name, ''),
        NEW.customer_email,
        NEW.customer_phone,
        ARRAY['feedback'],
        1,
        NOW(),
        'Geri bildirimden otomatik eklendi'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_feedback_insert_customer ON feedback;
CREATE TRIGGER on_feedback_insert_customer
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION handle_feedback_customer();
