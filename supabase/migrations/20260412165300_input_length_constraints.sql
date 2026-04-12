-- M7: CHECK constraints on user-controlled text columns (idempotent).
-- Server-side length caps prevent DoS/abuse from oversized strings.

-- Helper function to add a constraint only if it doesn't exist.
CREATE OR REPLACE FUNCTION pg_temp.add_check_if_missing(
  _table text, _name text, _expr text
) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = _name
      AND conrelid = ('public.' || _table)::regclass
  ) THEN
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%s)', _table, _name, _expr);
  END IF;
END $$;

-- clients
SELECT pg_temp.add_check_if_missing('clients', 'clients_name_length', 'name IS NULL OR length(name) <= 200');
SELECT pg_temp.add_check_if_missing('clients', 'clients_email_length', 'email IS NULL OR length(email) <= 254');
SELECT pg_temp.add_check_if_missing('clients', 'clients_phone_length', 'phone IS NULL OR length(phone) <= 32');
SELECT pg_temp.add_check_if_missing('clients', 'clients_address_length', 'address IS NULL OR length(address) <= 500');
SELECT pg_temp.add_check_if_missing('clients', 'clients_city_length', 'city IS NULL OR length(city) <= 100');
SELECT pg_temp.add_check_if_missing('clients', 'clients_postal_code_length', 'postal_code IS NULL OR length(postal_code) <= 20');
SELECT pg_temp.add_check_if_missing('clients', 'clients_notes_length', 'notes IS NULL OR length(notes) <= 5000');

-- devices
SELECT pg_temp.add_check_if_missing('devices', 'devices_brand_length', 'brand IS NULL OR length(brand) <= 100');
SELECT pg_temp.add_check_if_missing('devices', 'devices_model_length', 'model IS NULL OR length(model) <= 150');
SELECT pg_temp.add_check_if_missing('devices', 'devices_serial_length', 'serial_number IS NULL OR length(serial_number) <= 64');
SELECT pg_temp.add_check_if_missing('devices', 'devices_condition_length', 'condition IS NULL OR length(condition) <= 500');

-- repairs — biggest user-input payloads
SELECT pg_temp.add_check_if_missing('repairs', 'repairs_reference_length', 'reference IS NULL OR length(reference) <= 64');
SELECT pg_temp.add_check_if_missing('repairs', 'repairs_issue_length', 'issue IS NULL OR length(issue) <= 5000');
SELECT pg_temp.add_check_if_missing('repairs', 'repairs_diagnostic_length', 'diagnostic IS NULL OR length(diagnostic::text) <= 20000');
SELECT pg_temp.add_check_if_missing('repairs', 'repairs_internal_notes_length', 'internal_notes IS NULL OR length(internal_notes) <= 10000');
SELECT pg_temp.add_check_if_missing('repairs', 'repairs_technician_message_length', 'technician_message IS NULL OR length(technician_message) <= 5000');
SELECT pg_temp.add_check_if_missing('repairs', 'repairs_tracking_code_length', 'tracking_code IS NULL OR length(tracking_code) <= 64');

-- repair_messages — customer-facing, strictly bounded
SELECT pg_temp.add_check_if_missing('repair_messages', 'repair_messages_content_length', 'length(content) <= 5000');
SELECT pg_temp.add_check_if_missing('repair_messages', 'repair_messages_sender_name_length', 'sender_name IS NULL OR length(sender_name) <= 100');
SELECT pg_temp.add_check_if_missing('repair_messages', 'repair_messages_channel_length', 'length(channel) <= 32');

-- organizations
SELECT pg_temp.add_check_if_missing('organizations', 'organizations_name_length', 'name IS NULL OR length(name) <= 200');
SELECT pg_temp.add_check_if_missing('organizations', 'organizations_email_length', 'email IS NULL OR length(email) <= 254');
SELECT pg_temp.add_check_if_missing('organizations', 'organizations_phone_length', 'phone IS NULL OR length(phone) <= 32');
SELECT pg_temp.add_check_if_missing('organizations', 'organizations_address_length', 'address IS NULL OR length(address) <= 500');
SELECT pg_temp.add_check_if_missing('organizations', 'organizations_siret_length', 'siret IS NULL OR length(siret) <= 32');

-- inventory (column is `sku`, not `supplier_sku`)
SELECT pg_temp.add_check_if_missing('inventory', 'inventory_name_length', 'name IS NULL OR length(name) <= 200');
SELECT pg_temp.add_check_if_missing('inventory', 'inventory_supplier_length', 'supplier IS NULL OR length(supplier) <= 200');
SELECT pg_temp.add_check_if_missing('inventory', 'inventory_sku_length', 'sku IS NULL OR length(sku) <= 100');

-- services
SELECT pg_temp.add_check_if_missing('services', 'services_name_length', 'name IS NULL OR length(name) <= 200');
SELECT pg_temp.add_check_if_missing('services', 'services_description_length', 'description IS NULL OR length(description) <= 2000');

-- articles
SELECT pg_temp.add_check_if_missing('articles', 'articles_name_length', 'name IS NULL OR length(name) <= 200');
SELECT pg_temp.add_check_if_missing('articles', 'articles_description_length', 'description IS NULL OR length(description) <= 2000');
SELECT pg_temp.add_check_if_missing('articles', 'articles_sku_length', 'sku IS NULL OR length(sku) <= 100');
