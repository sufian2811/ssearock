-- Real Estate CRM Schema
-- Run this in your Supabase SQL Editor

-- Lead status enum
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'negotiating', 'closed', 'lost');

-- Message direction enum
CREATE TYPE message_direction AS ENUM ('incoming', 'outgoing');

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  property_interest TEXT,
  location TEXT,
  status lead_status NOT NULL DEFAULT 'new',
  notes TEXT,
  last_incoming_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations table (one per lead)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lead_id)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  direction message_direction NOT NULL,
  body TEXT NOT NULL,
  template_name TEXT,
  twilio_sid TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message templates (pre-approved WhatsApp templates)
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  content_sid TEXT,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_location ON leads(location);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_lead ON messages(lead_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Auto-update updated_at on leads
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create conversation when lead is inserted
CREATE OR REPLACE FUNCTION create_conversation_for_lead()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO conversations (lead_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lead_create_conversation
  AFTER INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION create_conversation_for_lead();

-- Update conversation last_message_at when message is inserted
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  IF NEW.direction = 'incoming' THEN
    UPDATE leads SET last_incoming_at = NEW.created_at WHERE id = NEW.lead_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- Seed default templates
INSERT INTO message_templates (name, body, variables) VALUES
  ('welcome', 'Hello {{1}}, thank you for your interest in our properties. How can we assist you today?', '["name"]'),
  ('property_inquiry', 'Hi {{1}}, we have new listings in {{2}} that match your interest. Would you like to schedule a viewing?', '["name", "location"]'),
  ('follow_up', 'Hi {{1}}, just following up on your property inquiry. Are you still interested?', '["name"]');

-- Enable Row Level Security (optional - configure policies as needed)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust for production)
CREATE POLICY "Allow all for service role" ON leads FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON conversations FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON message_templates FOR ALL USING (true);
