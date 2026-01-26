// title
title Tenant–Landlord Management System (Single DB, Multi-Tenant)

// =====================
// AUTH / IDENTITY
// =====================
users [icon: user, color: yellow] {
id string pk
email string
password_hash string
role enum // landlord | tenant
created_at timestamp
}

// =====================
// TENANT BOUNDARY (MULTI-TENANCY ROOT)
// =====================
landlords [icon: home, color: green] {
id string pk
user_id string fk
name string
contact_phone string
created_at timestamp
}

// =====================
// PEOPLE WHO LIVE IN PROPERTIES
// =====================
tenants [icon: user-check, color: blue] {
id string pk
user_id string fk
full_name string
phone string
email string
police_verification_number string
police_verification_date date
address string
created_at timestamp
}

// =====================
// ASSETS
// =====================
properties [icon: map-pin, color: orange] {
id string pk
landlord_id string fk
address string
property_type string
description string
created_at timestamp
}

// =====================
// TIME-BASED RELATIONSHIP (LEASE)
// =====================
tenancies [icon: calendar, color: purple] {
id string pk
tenant_id string fk
property_id string fk
lease_start date
lease_end date
status enum // active | ended
security_deposit decimal
created_at timestamp
ended_at timestamp
}

// =====================
// FINANCIAL EVENTS
// =====================
bills [icon: file-text, color: red] {
id string pk
tenant_id string fk
property_id string fk

bill_type enum // rent | electricity | water
billing_period_start date
billing_period_end date
due_date date
amount decimal
payment_status enum // pending | paid | overdue
paid_at timestamp
created_at timestamp
}

// =====================
// GENERATED ARTIFACTS
// =====================
documents [icon: file, color: gray] {
id string pk
tenant_id string fk
bill_id string fk nullable
document_type enum // rent_receipt | verification | statement
file_url string
generated_at timestamp
created_at timestamp
}

// =====================
// WORKFLOWS
// =====================
maintenance_requests [icon: tool, color: blue] {
id string pk
tenant_id string fk
property_id string fk
description string
status enum // submitted | in_progress | completed | cancelled
requested_at timestamp
updated_at timestamp
created_at timestamp
}

// =====================
// ASYNC COMMUNICATION
// =====================
notifications [icon: bell, color: orange] {
id string pk
user_id string fk
type enum // bill | maintenance | reminder | lease
message string
read boolean
sent_at timestamp
created_at timestamp
}

// =====================
// AUTOMATION
// =====================
payment_reminders [icon: alert-circle, color: red] {
id string pk
bill_id string fk
tenant_id string fk
status enum // pending | sent | acknowledged
reminder_sent_at timestamp
created_at timestamp
}

// =====================
// RELATIONSHIPS
// =====================

// identity
users.id > landlords.user_id
users.id > tenants.user_id

// ownership
landlords.id > properties.landlord_id

// leasing (time-based)
tenants.id > tenancies.tenant_id
properties.id > tenancies.property_id

// billing
tenants.id > bills.tenant_id
properties.id > bills.property_id

// documents
tenants.id > documents.tenant_id
bills.id - documents.bill_id

// maintenance
tenants.id > maintenance_requests.tenant_id
properties.id > maintenance_requests.property_id

// notifications
users.id > notifications.user_id

// reminders
bills.id > payment_reminders.bill_id
tenants.id > payment_reminders.tenant_id
