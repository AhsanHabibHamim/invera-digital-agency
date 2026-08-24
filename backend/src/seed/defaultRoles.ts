import Role from '../modules/roles/model';
import Permission from '../modules/permissions/model';
import RolePermission from '../modules/roles/rolePermission.model';

const DEFAULT_ROLES = [
  { name: 'Super Admin', slug: 'super_admin', description: 'Full system access', isSystem: true },
  { name: 'Admin', slug: 'admin', description: 'Administrative access', isSystem: true },
  { name: 'Developer', slug: 'developer', description: 'Developer with limited admin access', isSystem: true },
  { name: 'Team Member', slug: 'team_member', description: 'General team member', isSystem: true },
  { name: 'Project Manager', slug: 'project_manager', description: 'Manages projects and teams', isSystem: true },
  { name: 'Sales Executive', slug: 'sales_executive', description: 'Sales and lead management', isSystem: true },
  { name: 'Marketing Executive', slug: 'marketing_executive', description: 'Marketing and campaigns', isSystem: true },
  { name: 'Finance Manager', slug: 'finance_manager', description: 'Financial operations', isSystem: true },
  { name: 'HR', slug: 'hr', description: 'Human resources management', isSystem: true },
  { name: 'Support Executive', slug: 'support_executive', description: 'Client support', isSystem: true },
  { name: 'Client', slug: 'client', description: 'Client / End user', isSystem: true },
];

export async function seedRoles() {
  for (const roleData of DEFAULT_ROLES) {
    const existing = await Role.findOne({ slug: roleData.slug });
    if (!existing) {
      await Role.create(roleData);
      console.log(`  Created role: ${roleData.name}`);
    }
  }
}

const DEFAULT_PERMISSIONS = [
  // Dashboard permissions
  { name: 'View Super Admin Dashboard', slug: 'view_super_admin_dashboard', group: 'Dashboard', module: 'dashboard' },
  { name: 'View Admin Dashboard', slug: 'view_admin_dashboard', group: 'Dashboard', module: 'dashboard' },
  { name: 'View Developer Dashboard', slug: 'view_developer_dashboard', group: 'Dashboard', module: 'dashboard' },
  { name: 'View Project Manager Dashboard', slug: 'view_pm_dashboard', group: 'Dashboard', module: 'dashboard' },
  { name: 'View Sales Dashboard', slug: 'view_sales_dashboard', group: 'Dashboard', module: 'dashboard' },
  { name: 'View Marketing Dashboard', slug: 'view_marketing_dashboard', group: 'Dashboard', module: 'dashboard' },
  { name: 'View Finance Dashboard', slug: 'view_finance_dashboard', group: 'Dashboard', module: 'dashboard' },
  { name: 'View Support Dashboard', slug: 'view_support_dashboard', group: 'Dashboard', module: 'dashboard' },
  { name: 'View Client Dashboard', slug: 'view_client_dashboard', group: 'Dashboard', module: 'dashboard' },
  { name: 'View HR Dashboard', slug: 'view_hr_dashboard', group: 'Dashboard', module: 'dashboard' },

  // User management
  { name: 'Create Users', slug: 'create_users', group: 'User Management', module: 'users' },
  { name: 'Read Users', slug: 'read_users', group: 'User Management', module: 'users' },
  { name: 'Update Users', slug: 'update_users', group: 'User Management', module: 'users' },
  { name: 'Delete Users', slug: 'delete_users', group: 'User Management', module: 'users' },

  // Role management
  { name: 'Create Roles', slug: 'create_roles', group: 'Role Management', module: 'roles' },
  { name: 'Read Roles', slug: 'read_roles', group: 'Role Management', module: 'roles' },
  { name: 'Update Roles', slug: 'update_roles', group: 'Role Management', module: 'roles' },
  { name: 'Delete Roles', slug: 'delete_roles', group: 'Role Management', module: 'roles' },
  { name: 'Assign Permissions', slug: 'assign_permissions', group: 'Role Management', module: 'roles' },

  // Permission management
  { name: 'Create Permissions', slug: 'create_permissions', group: 'Permission Management', module: 'permissions' },
  { name: 'Read Permissions', slug: 'read_permissions', group: 'Permission Management', module: 'permissions' },
  { name: 'Update Permissions', slug: 'update_permissions', group: 'Permission Management', module: 'permissions' },
  { name: 'Delete Permissions', slug: 'delete_permissions', group: 'Permission Management', module: 'permissions' },

  // Lead management
  { name: 'Create Leads', slug: 'create_leads', group: 'Lead Management', module: 'leads' },
  { name: 'Read All Leads', slug: 'read_all_leads', group: 'Lead Management', module: 'leads' },
  { name: 'Read Own Leads', slug: 'read_own_leads', group: 'Lead Management', module: 'leads' },
  { name: 'Update All Leads', slug: 'update_all_leads', group: 'Lead Management', module: 'leads' },
  { name: 'Update Own Leads', slug: 'update_own_leads', group: 'Lead Management', module: 'leads' },
  { name: 'Delete Leads', slug: 'delete_leads', group: 'Lead Management', module: 'leads' },
  { name: 'Assign Leads', slug: 'assign_leads', group: 'Lead Management', module: 'leads' },
  { name: 'Export Leads', slug: 'export_leads', group: 'Lead Management', module: 'leads' },
  { name: 'Import Leads', slug: 'import_leads', group: 'Lead Management', module: 'leads' },
  { name: 'Bulk Lead Actions', slug: 'bulk_lead_actions', group: 'Lead Management', module: 'leads' },
  { name: 'Change Lead Status', slug: 'change_lead_status', group: 'Lead Management', module: 'leads' },

  // Project management
  { name: 'Create Projects', slug: 'create_projects', group: 'Project Management', module: 'projects' },
  { name: 'Read All Projects', slug: 'read_all_projects', group: 'Project Management', module: 'projects' },
  { name: 'Read Assigned Projects', slug: 'read_assigned_projects', group: 'Project Management', module: 'projects' },
  { name: 'Update Projects', slug: 'update_projects', group: 'Project Management', module: 'projects' },
  { name: 'Delete Projects', slug: 'delete_projects', group: 'Project Management', module: 'projects' },
  { name: 'Manage Milestones', slug: 'manage_milestones', group: 'Project Management', module: 'projects' },
  { name: 'Assign Team', slug: 'assign_team', group: 'Project Management', module: 'projects' },
  { name: 'Manage Sprints', slug: 'manage_sprints', group: 'Project Management', module: 'projects' },
  { name: 'Manage Tasks', slug: 'manage_tasks', group: 'Project Management', module: 'projects' },

  // Services
  { name: 'Create Services', slug: 'create_services', group: 'Service Management', module: 'services' },
  { name: 'Read Services', slug: 'read_services', group: 'Service Management', module: 'services' },
  { name: 'Update Services', slug: 'update_services', group: 'Service Management', module: 'services' },
  { name: 'Delete Services', slug: 'delete_services', group: 'Service Management', module: 'services' },

  // Quotes
  { name: 'Create Quotes', slug: 'create_quotes', group: 'Quote Management', module: 'quotes' },
  { name: 'Read Quotes', slug: 'read_quotes', group: 'Quote Management', module: 'quotes' },
  { name: 'Update Quotes', slug: 'update_quotes', group: 'Quote Management', module: 'quotes' },
  { name: 'Delete Quotes', slug: 'delete_quotes', group: 'Quote Management', module: 'quotes' },
  { name: 'Send Quotes', slug: 'send_quotes', group: 'Quote Management', module: 'quotes' },
  { name: 'Convert Quotes', slug: 'convert_quotes', group: 'Quote Management', module: 'quotes' },

  // Invoices
  { name: 'Create Invoices', slug: 'create_invoices', group: 'Invoice Management', module: 'invoices' },
  { name: 'Read Invoices', slug: 'read_invoices', group: 'Invoice Management', module: 'invoices' },
  { name: 'Update Invoices', slug: 'update_invoices', group: 'Invoice Management', module: 'invoices' },
  { name: 'Void Invoices', slug: 'void_invoices', group: 'Invoice Management', module: 'invoices' },
  { name: 'Confirm Payments', slug: 'confirm_payments', group: 'Invoice Management', module: 'invoices' },

  // Proposals
  { name: 'Create Proposals', slug: 'create_proposals', group: 'Proposal Management', module: 'proposals' },
  { name: 'Read Proposals', slug: 'read_proposals', group: 'Proposal Management', module: 'proposals' },
  { name: 'Review Proposals', slug: 'review_proposals', group: 'Proposal Management', module: 'proposals' },
  { name: 'Approve Proposals', slug: 'approve_proposals', group: 'Proposal Management', module: 'proposals' },

  // Messages
  { name: 'Send Messages', slug: 'send_messages', group: 'Messaging', module: 'messages' },
  { name: 'Read Messages', slug: 'read_messages', group: 'Messaging', module: 'messages' },

  // Notifications
  { name: 'Read Notifications', slug: 'read_notifications', group: 'Notifications', module: 'notifications' },
  { name: 'Manage Notifications', slug: 'manage_notifications', group: 'Notifications', module: 'notifications' },

  // CMS
  { name: 'Manage CMS', slug: 'manage_cms', group: 'Content Management', module: 'cms' },

  // Blog
  { name: 'Manage Blog', slug: 'manage_blog', group: 'Content Management', module: 'blog' },

  // Case Studies
  { name: 'Manage Case Studies', slug: 'manage_case_studies', group: 'Content Management', module: 'case-studies' },

  // Analytics
  { name: 'View Analytics', slug: 'view_analytics', group: 'Analytics', module: 'analytics' },

  // Activity Log
  { name: 'View Activity Log', slug: 'view_activity_log', group: 'System', module: 'activity_log' },

  // Uploads
  { name: 'Upload Files', slug: 'upload_files', group: 'File Management', module: 'uploads' },
  { name: 'Delete Files', slug: 'delete_files', group: 'File Management', module: 'uploads' },

  // Sales
  { name: 'Manage Sales Pipeline', slug: 'manage_sales_pipeline', group: 'Sales', module: 'sales' },
  { name: 'Set Sales Targets', slug: 'set_sales_targets', group: 'Sales', module: 'sales' },
  { name: 'Track Commissions', slug: 'track_commissions', group: 'Sales', module: 'sales' },

  // Finance
  { name: 'Manage Expenses', slug: 'manage_expenses', group: 'Finance', module: 'finance' },
  { name: 'Manage Income', slug: 'manage_income', group: 'Finance', module: 'finance' },
  { name: 'View Financial Reports', slug: 'view_financial_reports', group: 'Finance', module: 'finance' },

  // HR
  { name: 'Manage Employees', slug: 'manage_employees', group: 'HR', module: 'hr' },
  { name: 'Manage Attendance', slug: 'manage_attendance', group: 'HR', module: 'hr' },
  { name: 'Manage Leave', slug: 'manage_leave', group: 'HR', module: 'hr' },
  { name: 'Manage Recruitment', slug: 'manage_recruitment', group: 'HR', module: 'hr' },

  // Support
  { name: 'Manage Tickets', slug: 'manage_tickets', group: 'Support', module: 'support' },
  { name: 'Read Tickets', slug: 'read_tickets', group: 'Support', module: 'support' },
  { name: 'Reply Tickets', slug: 'reply_tickets', group: 'Support', module: 'support' },

  // Settings
  { name: 'Manage System Settings', slug: 'manage_system_settings', group: 'System', module: 'settings' },
  { name: 'Manage Security', slug: 'manage_security', group: 'System', module: 'security' },
  { name: 'View Audit Logs', slug: 'view_audit_logs', group: 'System', module: 'audit' },
];

export async function seedPermissions() {
  for (const permData of DEFAULT_PERMISSIONS) {
    const existing = await Permission.findOne({ slug: permData.slug });
    if (!existing) {
      await Permission.create(permData);
      console.log(`  Created permission: ${permData.name}`);
    }
  }
}

export async function seedRolePermissions() {
  const superAdminRole = await Role.findOne({ slug: 'super_admin' });
  const adminRole = await Role.findOne({ slug: 'admin' });
  const allPermissions = await Permission.find({});

  if (superAdminRole) {
    for (const perm of allPermissions) {
      const existing = await RolePermission.findOne({ roleId: superAdminRole._id, permissionId: perm._id });
      if (!existing) {
        await RolePermission.create({ roleId: superAdminRole._id, permissionId: perm._id });
      }
    }
    console.log('  Assigned all permissions to Super Admin');
  }

  if (adminRole) {
    const adminSlugs = [
      'view_admin_dashboard', 'read_users', 'update_users',
      'read_roles', 'read_permissions',
      'create_leads', 'read_all_leads', 'update_all_leads', 'delete_leads', 'assign_leads', 'change_lead_status', 'export_leads',
      'create_projects', 'read_all_projects', 'update_projects', 'manage_milestones', 'assign_team',
      'create_services', 'read_services', 'update_services',
      'create_quotes', 'read_quotes', 'update_quotes', 'send_quotes', 'convert_quotes',
      'create_invoices', 'read_invoices', 'update_invoices', 'confirm_payments',
      'read_proposals', 'review_proposals', 'approve_proposals',
      'send_messages', 'read_messages',
      'read_notifications',
      'manage_cms', 'manage_blog', 'manage_case_studies',
      'view_analytics', 'view_activity_log',
      'upload_files',
      'manage_sales_pipeline', 'manage_expenses', 'manage_income', 'view_financial_reports',
    ];
    const adminPerms = allPermissions.filter(p => adminSlugs.includes(p.slug));
    for (const perm of adminPerms) {
      const existing = await RolePermission.findOne({ roleId: adminRole._id, permissionId: perm._id });
      if (!existing) {
        await RolePermission.create({ roleId: adminRole._id, permissionId: perm._id });
      }
    }
    console.log(`  Assigned ${adminPerms.length} permissions to Admin`);
  }
}

export async function seedAll() {
  console.log('Seeding roles...');
  await seedRoles();
  console.log('Seeding permissions...');
  await seedPermissions();
  console.log('Seeding role-permission assignments...');
  await seedRolePermissions();
  console.log('Seeding complete.');
}
