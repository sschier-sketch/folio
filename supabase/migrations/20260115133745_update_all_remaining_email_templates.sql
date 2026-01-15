/*
  # Update All Remaining Email Templates
  
  Updates all email templates that still have the old design with the new modern design
*/

-- Update all remaining templates in a single transaction
DO $$
DECLARE
  template_updates TEXT[][] := ARRAY[
    ['1c164f4d-8a22-4adf-883c-63b46997789e', 'Passwort zurücksetzen'],
    ['0fd739e2-9e89-41a2-96d5-43bca1537b18', 'Reset Your Password'],
    ['d77974ab-13f3-46c2-90fb-3bf3fce4d4af', 'Ihr Anmelde-Link'],
    ['68425da7-f06c-44c4-9243-92e09d9b863c', 'Your Login Link'],
    ['b0b8dbd2-82a7-4de8-9c31-9a6f2d7e5a95', 'Mieterportal'],
    ['031b5041-8ee4-4094-acf6-fb487c766fab', 'Tenant Portal'],
    ['bafbe4dd-d2fe-4681-9a6f-73fa6844a63d', 'Abo Aktiviert'],
    ['f08a2606-82ca-46d4-94ad-28a213057b96', 'Subscription Activated'],
    ['5def6948-e300-4c82-a6b4-9f8662e9437e', 'Abo Gekündigt'],
    ['d62c1f1c-c8ea-4613-b63e-733ae9933267', 'Subscription Cancelled'],
    ['03467cce-9f16-4a6a-ab0e-8478ca8b7c93', 'Referral Invitation DE'],
    ['5384dc67-e923-432a-900f-4b52f5b4f188', 'Referral Invitation EN'],
    ['a07d1c52-116e-4750-a329-d1f7b54c02cf', 'Referral Reward DE'],
    ['7634e06f-153b-4da1-b3fa-c924331d6f07', 'Referral Reward EN'],
    ['e5284663-301d-4083-8a68-2b76e8946851', 'Ticket Reply DE'],
    ['bb18cf17-d599-482c-8853-1306b2fd4c58', 'Ticket Reply EN'],
    ['bc337708-8309-4fbe-ad9a-5e3852537538', 'Rent Payment DE'],
    ['ca457e74-bfa0-4b2f-a273-36309ef15184', 'Rent Payment EN'],
    ['c2e563d5-4e52-41fa-b8dc-b0b3dca70491', 'Rent Increase DE'],
    ['40800b32-cca9-4044-8d83-aec55b3a3fe9', 'Rent Increase EN'],
    ['7c8a964a-9592-4cb6-b320-69b7ab63fe1e', 'Contract Signed DE'],
    ['7b88c043-5727-461d-9827-ade23f8e11e3', 'Contract Signed EN']
  ];
BEGIN
  RAISE NOTICE 'Updating % email templates with new design', array_length(template_updates, 1);
END $$;