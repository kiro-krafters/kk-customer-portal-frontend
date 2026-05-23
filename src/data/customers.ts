export interface Policy {
  policyId: string;
  type: 'Auto' | 'Home' | 'Health' | 'Life';
  status: 'Active' | 'Expired' | 'Pending';
  premium: number;
  coverageAmount: number;
  startDate: string;
  endDate: string;
  deductible: number;
}

export interface Claim {
  claimId: string;
  policyId: string;
  type: string;
  status: 'Under Review' | 'Approved' | 'Rejected' | 'Settled' | 'Pending Documents';
  filedDate: string;
  amount: number;
  description: string;
  estimatedResolution: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  memberSince: string;
  policies: Policy[];
  claims: Claim[];
}

export const customerDatabase: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Jane Smith',
    email: 'jane.smith@email.com',
    phone: '+1 (555) 234-5678',
    address: '123 Maple Street, Austin, TX 78701',
    memberSince: '2019-03-15',
    policies: [
      {
        policyId: 'KI-100123',
        type: 'Auto',
        status: 'Active',
        premium: 1200,
        coverageAmount: 500000,
        startDate: '2024-01-01',
        endDate: '2025-01-01',
        deductible: 500,
      },
      {
        policyId: 'KI-100124',
        type: 'Home',
        status: 'Active',
        premium: 2400,
        coverageAmount: 350000,
        startDate: '2024-03-01',
        endDate: '2025-03-01',
        deductible: 1000,
      },
    ],
    claims: [
      {
        claimId: 'CLM-88201',
        policyId: 'KI-100123',
        type: 'Auto Accident',
        status: 'Under Review',
        filedDate: '2025-05-10',
        amount: 4800,
        description: 'Rear-end collision at traffic light. Front bumper and hood damage.',
        estimatedResolution: '3–5 business days',
      },
    ],
  },
  {
    id: 'CUST-002',
    name: 'Robert Johnson',
    email: 'r.johnson@email.com',
    phone: '+1 (555) 345-6789',
    address: '456 Oak Avenue, Denver, CO 80202',
    memberSince: '2021-07-22',
    policies: [
      {
        policyId: 'KI-200456',
        type: 'Health',
        status: 'Active',
        premium: 3600,
        coverageAmount: 1000000,
        startDate: '2025-01-01',
        endDate: '2026-01-01',
        deductible: 2500,
      },
    ],
    claims: [
      {
        claimId: 'CLM-77432',
        policyId: 'KI-200456',
        type: 'Medical',
        status: 'Approved',
        filedDate: '2025-04-20',
        amount: 1250,
        description: 'Emergency room visit — appendicitis treatment.',
        estimatedResolution: 'Approved — payment in 2 business days',
      },
      {
        claimId: 'CLM-77501',
        policyId: 'KI-200456',
        type: 'Medical',
        status: 'Pending Documents',
        filedDate: '2025-05-18',
        amount: 680,
        description: 'Specialist consultation.',
        estimatedResolution: 'Awaiting lab report submission',
      },
    ],
  },
  {
    id: 'CUST-003',
    name: 'Maria Garcia',
    email: 'maria.g@email.com',
    phone: '+1 (555) 456-7890',
    address: '789 Pine Road, Miami, FL 33101',
    memberSince: '2018-11-05',
    policies: [
      {
        policyId: 'KI-300789',
        type: 'Home',
        status: 'Active',
        premium: 1800,
        coverageAmount: 425000,
        startDate: '2024-11-01',
        endDate: '2025-11-01',
        deductible: 1500,
      },
      {
        policyId: 'KI-300790',
        type: 'Life',
        status: 'Active',
        premium: 900,
        coverageAmount: 750000,
        startDate: '2020-01-01',
        endDate: '2040-01-01',
        deductible: 0,
      },
    ],
    claims: [],
  },
  {
    id: 'CUST-004',
    name: 'David Chen',
    email: 'd.chen@email.com',
    phone: '+1 (555) 567-8901',
    address: '321 Elm Street, Seattle, WA 98101',
    memberSince: '2022-02-14',
    policies: [
      {
        policyId: 'KI-400321',
        type: 'Auto',
        status: 'Active',
        premium: 980,
        coverageAmount: 300000,
        startDate: '2025-02-01',
        endDate: '2026-02-01',
        deductible: 750,
      },
    ],
    claims: [
      {
        claimId: 'CLM-99102',
        policyId: 'KI-400321',
        type: 'Theft',
        status: 'Settled',
        filedDate: '2025-03-05',
        amount: 15000,
        description: 'Vehicle stolen from parking garage.',
        estimatedResolution: 'Settled — $14,200 disbursed on 2025-04-01',
      },
    ],
  },
  {
    id: 'CUST-005',
    name: 'Sarah Williams',
    email: 's.williams@email.com',
    phone: '+1 (555) 678-9012',
    address: '654 Birch Lane, Chicago, IL 60601',
    memberSince: '2020-09-30',
    policies: [
      {
        policyId: 'KI-500654',
        type: 'Health',
        status: 'Active',
        premium: 4200,
        coverageAmount: 800000,
        startDate: '2025-01-01',
        endDate: '2026-01-01',
        deductible: 1500,
      },
      {
        policyId: 'KI-500655',
        type: 'Auto',
        status: 'Expired',
        premium: 1100,
        coverageAmount: 250000,
        startDate: '2024-01-01',
        endDate: '2025-01-01',
        deductible: 500,
      },
    ],
    claims: [
      {
        claimId: 'CLM-66310',
        policyId: 'KI-500654',
        type: 'Medical',
        status: 'Rejected',
        filedDate: '2025-05-01',
        amount: 350,
        description: 'Routine dental cleaning — not covered under plan.',
        estimatedResolution: 'Rejected — dental not included in current plan',
      },
    ],
  },
];

export function lookupByPolicyNumber(policyNumber: string): { customer: Customer; policy: Policy } | null {
  const normalized = policyNumber.trim().toUpperCase();
  for (const customer of customerDatabase) {
    const policy = customer.policies.find((p) => p.policyId.toUpperCase() === normalized);
    if (policy) return { customer, policy };
  }
  return null;
}

export function lookupByName(name: string): Customer | null {
  const normalized = name.trim().toLowerCase();
  return customerDatabase.find((c) => c.name.toLowerCase().includes(normalized)) ?? null;
}
