// Migration configuration for API encryption
export interface ApiMigrationConfig {
  [endpoint: string]: {
    encrypted: boolean;
    priority: 'high' | 'medium' | 'low';
    description: string;
    migrated?: boolean;
  };
}

// Configuration for API migration - we'll migrate step by step
export const migrationConfig: ApiMigrationConfig = {
  // HIGH PRIORITY: Sensitive user data
  '/api/user/get-profile': {
    encrypted: true, // MIGRATED! ✅
    priority: 'high',
    description: 'User profile data - contains personal information',
    migrated: true
  },
  '/api/user/update-profile': {
    encrypted: true, // MIGRATED! ✅
    priority: 'high', 
    description: 'User profile updates - sensitive personal data',
    migrated: true
  },
  '/api/user/login': {
    encrypted: true, // STEP 3: MIGRATED! ✅
    priority: 'high',
    description: 'User authentication - credentials',
    migrated: true
  },
  '/api/user/register': {
    encrypted: true, // STEP 3: MIGRATED! ✅
    priority: 'high',
    description: 'User registration - credentials and personal data',
    migrated: true
  },

  // MEDIUM PRIORITY: Medical and appointment data
  '/api/user/book-appointment': {
    encrypted: true, // STEP 4: MIGRATED! ✅
    priority: 'medium',
    description: 'Appointment booking - medical data',
    migrated: true
  },
  '/api/user/appointments': {
    encrypted: true, // STEP 4: MIGRATED! ✅
    priority: 'medium',
    description: 'User appointments list - medical history',
    migrated: true
  },
  '/api/user/cancel-appointment': {
    encrypted: true, // STEP 4: MIGRATED! ✅
    priority: 'medium',
    description: 'Appointment cancellation',
    migrated: true
  },
  '/api/user/rate-doctor': {
    encrypted: true,
    priority: 'medium',
    description: 'Patient rates and comments on doctor performance',
    migrated: true
  },
  '/api/doctor/appointments': {
    encrypted: true, // STEP 5: MIGRATED! ✅
    priority: 'medium',
    description: 'Doctor appointments - patient data',
    migrated: true
  },
  '/api/doctor/profile': {
    encrypted: true, // STEP 5: MIGRATED! ✅
    priority: 'medium',
    description: 'Doctor profile data',
    migrated: true
  },
  '/api/doctor/update-profile': {
    encrypted: true, // STEP 5: MIGRATED! ✅
    priority: 'medium',
    description: 'Doctor profile updates',
    migrated: true
  },
  '/api/doctor/dashboard': {
    encrypted: true, // STEP 5: MIGRATED! ✅
    priority: 'medium',
    description: 'Doctor dashboard data',
    migrated: true
  },

  // MEDIUM PRIORITY: Admin operations - STEP 6: MIGRATED! ✅
  '/api/admin/login': {
    encrypted: true,
    priority: 'medium',
    description: 'Admin authentication',
    migrated: true
  },
  '/api/admin/all-doctors': {
    encrypted: true,
    priority: 'medium',
    description: 'All doctors data',
    migrated: true
  },
  '/api/admin/appointments': {
    encrypted: true,
    priority: 'medium',
    description: 'All appointments data',
    migrated: true
  },
  '/api/admin/dashboard': {
    encrypted: true,
    priority: 'medium',
    description: 'Admin dashboard statistics',
    migrated: true
  },

  // LOW PRIORITY: Public and less sensitive data - STEP 7: MIGRATED! ✅
  '/api/doctor/list': {
    encrypted: true,
    priority: 'low',
    description: 'Public doctors list',
    migrated: true
  },
  '/api/doctor/login': {
    encrypted: true,
    priority: 'low',
    description: 'Doctor authentication',
    migrated: true
  },
  '/api/doctor/register': {
    encrypted: true, // MIGRATED! ✅
    priority: 'low',
    description: 'Doctor registration - Now using encrypted smartApi to handle multipart data',
    migrated: true
  },

  // ADDITIONAL ENDPOINTS DISCOVERED - STEP 8: MIGRATED! ✅
  '/api/doctor/cancel-appointment': {
    encrypted: true,
    priority: 'medium',
    description: 'Doctor cancel appointment',
    migrated: true
  },
  '/api/doctor/complete-appointment': {
    encrypted: true,
    priority: 'medium',
    description: 'Doctor complete appointment',
    migrated: true
  },
  '/api/admin/change-availability': {
    encrypted: true,
    priority: 'medium',
    description: 'Change doctor availability',
    migrated: true
  },
  '/api/admin/cancel-appointment': {
    encrypted: true,
    priority: 'medium',
    description: 'Admin cancel appointment',
    migrated: true
  },
  '/api/admin/add-doctor': {
    encrypted: true, // MIGRATED! ✅
    priority: 'low',
    description: 'Add new doctor - sensitive data',
    migrated: true
  },
  '/api/admin/delete-doctor': {
    encrypted: true,
    priority: 'medium',
    description: 'Delete doctor profile',
    migrated: true
  },
  '/api/admin/edit-doctor': {
    encrypted: true, // MIGRATED! ✅
    priority: 'low',
    description: 'Edit doctor profile - sensitive data',
    migrated: true
  },
  '/api/admin/all-patients': {
    encrypted: true,
    priority: 'medium',
    description: 'All patients list',
    migrated: true
  },
  '/api/admin/approve-doctor': {
    encrypted: true,
    priority: 'medium',
    description: 'Approve doctor registration',
    migrated: true
  },
  '/api/admin/reject-doctor': {
    encrypted: true,
    priority: 'medium',
    description: 'Reject doctor registration',
    migrated: true
  },
  '/api/admin/edit-patient': {
    encrypted: true, // MIGRATED! ✅
    priority: 'low',
    description: 'Edit patient profile - sensitive data',
    migrated: true
  },
  '/api/admin/earnings': {
    encrypted: true,
    priority: 'medium',
    description: 'Admin earnings statistics',
    migrated: true
  },
  '/api/user/payment-paystack': {
    encrypted: false,
    priority: 'low',
    description: 'Initialize Paystack payment - EXCLUDED from migration',
    migrated: false
  },
  '/api/user/verify-paystack': {
    encrypted: false,
    priority: 'low',
    description: 'Verify Paystack payment - EXCLUDED from migration',
    migrated: false
  },

  '/api/vitals/latest': {
    encrypted: true,
    priority: 'low',
    description: 'Latest vitals data',
    migrated: true
  },

  // ALREADY ENCRYPTED: Test endpoints
  '/api/secure/dummy-data': {
    encrypted: true,
    priority: 'high',
    description: 'Test encrypted endpoint',
    migrated: true
  }
};

// Helper functions for migration management
export const getMigrationStatus = () => {
  const total = Object.keys(migrationConfig).length;
  const migrated = Object.values(migrationConfig).filter(config => config.migrated).length;
  const encrypted = Object.values(migrationConfig).filter(config => config.encrypted).length;
  
  return {
    total,
    migrated,
    encrypted,
    progress: (migrated / total) * 100
  };
};

export const getEndpointsByPriority = (priority: 'high' | 'medium' | 'low') => {
  return Object.entries(migrationConfig)
    .filter(([, config]) => config.priority === priority)
    .map(([endpoint, config]) => ({ endpoint, ...config }));
};

export const isEndpointEncrypted = (endpoint: string): boolean => {
  return migrationConfig[endpoint]?.encrypted || false;
};

export const markEndpointMigrated = (endpoint: string) => {
  if (migrationConfig[endpoint]) {
    migrationConfig[endpoint].migrated = true;
    migrationConfig[endpoint].encrypted = true;
  }
};

export const enableEncryptionForEndpoint = (endpoint: string) => {
  if (migrationConfig[endpoint]) {
    migrationConfig[endpoint].encrypted = true;
  }
}; 